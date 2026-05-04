# ── hybrid_fusion.py ───────────────────────────────────────
# Parallel fusion of live and snapshot observations.

import math
import threading
import time
from collections import deque
from typing import Any

from config import (
    EAR_THRESHOLD,
    MAR_THRESHOLD,
    HYBRID_WEIGHT_LIVE,
    HYBRID_WEIGHT_SNAPSHOT,
    HYBRID_SIGMOID_GAIN,
    HYBRID_TEMPORAL_GAMMA,
    HYBRID_PHYS_DELTA,
    HYBRID_ON_THRESHOLD,
    HYBRID_OFF_THRESHOLD,
    HYBRID_DISAGREEMENT_TAU,
    HYBRID_STALE_SECONDS,
    HYBRID_UNCERTAIN_WINDOWS,
    HYBRID_EMOTION_WINDOW,
    HYBRID_EMOTION_CONFIDENCE_MIN,
    HYBRID_EMOTION_HOLD_SECONDS,
)

_state_lock = threading.Lock()

_last_live: dict[str, Any] | None = None
_last_snapshot: dict[str, Any] | None = None

_prev_fused_prob = 0.0
_alarm_on = False
_uncertain_windows = 0
_emotion_history = deque(maxlen=HYBRID_EMOTION_WINDOW)
_last_display_emotion = "neutral"
_last_emotion_ts = 0.0


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, float(v)))


def _sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def _is_stale(obs: dict[str, Any] | None, now_ts: float) -> bool:
    if not obs:
        return True
    ts = float(obs.get("timestamp", 0.0))
    return (now_ts - ts) > HYBRID_STALE_SECONDS


def _drowsy_prob_from_status(status: str, confidence: float | None) -> float:
    s = (status or "").strip().lower()
    if confidence is None:
        return 1.0 if s == "drowsy" else 0.0 if s == "awake" else 0.5

    conf = _clamp01(confidence)
    if s == "drowsy":
        return conf
    if s == "awake":
        return 1.0 - conf
    return 0.5


def _phys_prob(obs: dict[str, Any] | None) -> float:
    if not obs:
        return 0.0

    perclos = float(obs.get("perclos", 0.0) or 0.0)
    yawn_pct = float(obs.get("yawn_pct", 0.0) or 0.0)

    ear_raw = obs.get("ear")
    mar_raw = obs.get("mar")
    yawn_flag = bool(obs.get("yawn", False))

    perclos_term = _clamp01(perclos / 20.0)
    yawn_term = _clamp01(yawn_pct / 50.0)

    if yawn_flag:
        yawn_term = max(yawn_term, 0.60)

    if mar_raw is not None:
        mar = float(mar_raw)
        if mar > MAR_THRESHOLD:
            yawn_term = max(yawn_term, _clamp01(((mar - MAR_THRESHOLD) / 0.20) + 0.50))

    eye_term = 0.0
    if ear_raw is not None:
        ear = float(ear_raw)
        eye_term = _clamp01((EAR_THRESHOLD - ear) / 0.08)

    return max(perclos_term, yawn_term, eye_term)


def _observation_prob(obs: dict[str, Any] | None) -> float:
    if not obs:
        return 0.50

    if obs.get("risk_prob") is not None:
        return _clamp01(float(obs["risk_prob"]))

    keras_p = _drowsy_prob_from_status(
        str(obs.get("status", "Unknown")),
        float(obs["confidence"]) if obs.get("confidence") is not None else None,
    )
    phys_p = _phys_prob(obs)

    return _clamp01((0.75 * keras_p) + (0.25 * phys_p))


def _pick_emotion(live: dict[str, Any] | None, snapshot: dict[str, Any] | None) -> str:
    if live and snapshot:
        if float(snapshot.get("timestamp", 0.0)) >= float(live.get("timestamp", 0.0)):
            return str(snapshot.get("emotion", live.get("emotion", "neutral")))
        return str(live.get("emotion", snapshot.get("emotion", "neutral")))
    if snapshot:
        return str(snapshot.get("emotion", "neutral"))
    if live:
        return str(live.get("emotion", "neutral"))
    return "neutral"


def _is_yawning(live: dict[str, Any] | None, snapshot: dict[str, Any] | None) -> bool:
    for obs in (live, snapshot):
        if not obs:
            continue
        if bool(obs.get("yawn", False)):
            return True
        mar_raw = obs.get("mar")
        if mar_raw is not None:
            try:
                if float(mar_raw) > MAR_THRESHOLD:
                    return True
            except Exception:
                pass
        yawn_pct = float(obs.get("yawn_pct", 0.0) or 0.0)
        if yawn_pct >= 25.0:
            return True
    return False


def _push_emotion_sample(obs: dict[str, Any]) -> None:
    label = str(obs.get("emotion", "neutral") or "neutral").lower()
    conf_raw = obs.get("emotion_confidence")
    if conf_raw is None:
        conf = 0.5
    else:
        try:
            conf = _clamp01(float(conf_raw))
        except Exception:
            conf = 0.5
    ts = float(obs.get("timestamp", time.time()))
    _emotion_history.append({"label": label, "conf": conf, "ts": ts})


def _smoothed_emotion(raw_emotion: str, now_ts: float, yawning: bool) -> tuple[str, str]:
    global _last_display_emotion, _last_emotion_ts

    if yawning:
        _last_display_emotion = "fatigued"
        _last_emotion_ts = now_ts
        return "fatigued", "yawn_override"

    if not _emotion_history:
        _last_display_emotion = raw_emotion
        _last_emotion_ts = now_ts
        return raw_emotion, "raw"

    # Weighted majority vote by confidence
    weighted: dict[str, float] = {}
    latest_conf = 0.5
    for sample in _emotion_history:
        label = str(sample["label"]).lower()
        conf = _clamp01(float(sample["conf"]))
        weighted[label] = weighted.get(label, 0.0) + conf
    latest_conf = _clamp01(float(_emotion_history[-1]["conf"]))

    mode_label = max(weighted.items(), key=lambda kv: kv[1])[0]

    # If newest confidence is too low, keep previous stable emotion briefly.
    if latest_conf < HYBRID_EMOTION_CONFIDENCE_MIN:
        if (now_ts - _last_emotion_ts) <= HYBRID_EMOTION_HOLD_SECONDS:
            return _last_display_emotion, "low_conf_hold"

    _last_display_emotion = mode_label
    _last_emotion_ts = now_ts
    return mode_label, "majority_vote"


def register_live_observation(obs: dict[str, Any]) -> None:
    global _last_live
    payload = dict(obs)
    payload["source"] = "live"
    payload["timestamp"] = float(payload.get("timestamp", time.time()))
    with _state_lock:
        _last_live = payload
        _push_emotion_sample(payload)


def register_snapshot_observation(obs: dict[str, Any]) -> None:
    global _last_snapshot
    payload = dict(obs)
    payload["source"] = "snapshot"
    payload["timestamp"] = float(payload.get("timestamp", time.time()))
    with _state_lock:
        _last_snapshot = payload
        _push_emotion_sample(payload)


def reset_hybrid_state() -> None:
    global _last_live, _last_snapshot, _prev_fused_prob, _alarm_on, _uncertain_windows
    global _last_display_emotion, _last_emotion_ts
    with _state_lock:
        _last_live = None
        _last_snapshot = None
        _prev_fused_prob = 0.0
        _alarm_on = False
        _uncertain_windows = 0
        _emotion_history.clear()
        _last_display_emotion = "neutral"
        _last_emotion_ts = 0.0


def get_fused_decision(now_ts: float | None = None) -> dict[str, Any] | None:
    global _prev_fused_prob, _alarm_on, _uncertain_windows

    now_val = float(time.time() if now_ts is None else now_ts)

    with _state_lock:
        live = None if _is_stale(_last_live, now_val) else _last_live
        snap = None if _is_stale(_last_snapshot, now_val) else _last_snapshot

        if not live and not snap:
            return None

        p_live = _observation_prob(live) if live else None
        p_snap = _observation_prob(snap) if snap else None

        if p_live is not None and p_snap is not None:
            weight_live = HYBRID_WEIGHT_LIVE
            weight_snap = HYBRID_WEIGHT_SNAPSHOT
            weighted = (weight_live * p_live) + (weight_snap * p_snap)
        elif p_live is not None:
            weight_live = 1.0
            weight_snap = 0.0
            weighted = p_live
        else:
            weight_live = 0.0
            weight_snap = 1.0
            weighted = p_snap if p_snap is not None else 0.5

        phys_p = max(_phys_prob(live), _phys_prob(snap))

        linear = (
            HYBRID_SIGMOID_GAIN * (weighted - 0.5)
            + HYBRID_TEMPORAL_GAMMA * (_prev_fused_prob - 0.5)
            + HYBRID_PHYS_DELTA * (phys_p - 0.5)
        )
        p_fused = _sigmoid(linear)

        disagreement = 0.0
        if p_live is not None and p_snap is not None:
            disagreement = abs(p_live - p_snap)

        if disagreement > HYBRID_DISAGREEMENT_TAU:
            _uncertain_windows += 1
        else:
            _uncertain_windows = max(0, _uncertain_windows - 1)

        uncertain = _uncertain_windows >= HYBRID_UNCERTAIN_WINDOWS

        if _alarm_on:
            if (p_fused <= HYBRID_OFF_THRESHOLD) and not uncertain:
                _alarm_on = False
        else:
            if (p_fused >= HYBRID_ON_THRESHOLD) and not uncertain:
                _alarm_on = True

        if uncertain:
            status = "Uncertain"
        else:
            status = "Drowsy" if _alarm_on else "Awake"

        if p_fused >= HYBRID_ON_THRESHOLD:
            risk_level = "HIGH"
        elif p_fused >= 0.45:
            risk_level = "MEDIUM/LOW"
        else:
            risk_level = "LOW"

        raw_emotion = _pick_emotion(live, snap)
        yawning = _is_yawning(live, snap)
        emotion, emotion_reason = _smoothed_emotion(raw_emotion, now_val, yawning)

        _prev_fused_prob = p_fused

        reason = (
            f"p_live={p_live if p_live is not None else 'NA'} "
            f"p_snap={p_snap if p_snap is not None else 'NA'} "
            f"fused={round(p_fused, 3)} disagree={round(disagreement, 3)}"
        )

        return {
            "status": status,
            "emotion": emotion,
            "emotion_raw": raw_emotion,
            "emotion_reason": emotion_reason,
            "risk_level": risk_level,
            "risk_prob": round(p_fused, 4),
            "uncertain": uncertain,
            "disagreement": round(disagreement, 4),
            "source_weights": {
                "live": round(weight_live, 3),
                "snapshot": round(weight_snap, 3),
            },
            "source_probs": {
                "live": round(p_live, 4) if p_live is not None else None,
                "snapshot": round(p_snap, 4) if p_snap is not None else None,
            },
            "reason": reason,
        }
