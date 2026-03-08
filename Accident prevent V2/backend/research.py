# ── research.py ─────────────────────────────────────────────
# In-memory session history + metric calculation + prediction.

from collections import deque
import numpy as np

from config import MAX_HISTORY, RECORDS_PER_MINUTE, PREDICTION_MINUTES

# ── Session state ────────────────────────────────────────────
analysis_history     = deque(maxlen=MAX_HISTORY)
session_record_count = 0   # absolute total of records added since start


# ── History management ───────────────────────────────────────

def add_record(status: str, emotion: str, timestamp: float):
    """Append one analysis result to the rolling history."""
    global session_record_count
    analysis_history.append({"status": status, "emotion": emotion, "timestamp": timestamp})
    session_record_count += 1


def clear_session():
    """Reset the rolling history and total record count."""
    global session_record_count
    analysis_history.clear()
    session_record_count = 0


# ── Metrics ──────────────────────────────────────────────────

def calculate_metrics(chunk: list) -> dict:
    if not chunk:
        return {"drowsyPercentage": 0, "microSleeps": 0, "maxConsecutiveDrowsy": 0}

    total        = len(chunk)
    drowsy_count = sum(1 for h in chunk if h["status"] == "Drowsy")

    micro_sleeps = sum(
        1 for i in range(1, total - 1)
        if chunk[i-1]["status"] == "Awake"
        and chunk[i]["status"]   == "Drowsy"
        and chunk[i+1]["status"] == "Awake"
    )

    max_streak = cur = 0
    for h in chunk:
        if h["status"] == "Drowsy":
            cur += 1
            max_streak = max(max_streak, cur)
        else:
            cur = 0

    return {
        "drowsyPercentage":     round(drowsy_count / total * 100, 1),
        "microSleeps":          micro_sleeps,
        "maxConsecutiveDrowsy": max_streak,
    }


# ── Minute-by-minute analysis ────────────────────────────────

def get_minute_by_minute_analysis() -> list:
    """
    Returns up to 5 FULL minutes (20 records each) from history.
    Does NOT include the current partial minute.
    """
    history_list = list(analysis_history)
    total_in_history = len(history_list)
    
    # How many records in the current partial minute?
    partial_count = session_record_count % RECORDS_PER_MINUTE
    
    # Everything else belongs to completed minutes
    completed_in_history = total_in_history - partial_count
    num_full_minutes = completed_in_history // RECORDS_PER_MINUTE
    
    results = []
    # Take up to last 5 full mins
    for i in range(min(5, num_full_minutes)):
        end = total_in_history - partial_count - (i * RECORDS_PER_MINUTE)
        start = end - RECORDS_PER_MINUTE
        if start < 0: break
        
        chunk = history_list[start:end]
        # Global minute index for this chunk
        global_min = ((session_record_count - partial_count) // RECORDS_PER_MINUTE) - i
        
        results.append({
            "minute":  global_min,
            "x":       float(global_min),
            "label":   f"Min {global_min}",
            "metrics": calculate_metrics(chunk),
        })

    results.reverse() # Oldest first
    return results


# ── Future Prediction ────────────────────────────────────────

def predict_future_drowsiness(actual_data: list, current_minute_pred: list, future_minutes: int = PREDICTION_MINUTES) -> list:
    """
    Polynomial regression extrapolation of drowsiness % for the
    next `future_minutes` minutes. If actual_data is thin, it uses
    the current_minute_pred end point as a baseline.
    """
    # 1. Determine baseline x and value
    if not actual_data and not current_minute_pred:
        return []

    # Default to current minute endpoint as start for future
    if current_minute_pred:
        last_pt = current_minute_pred[-1]
        last_x = float(last_pt["x"])
        last_val = float(last_pt["cPct"])
    else:
        last_pt = actual_data[-1]
        last_x = float(last_pt.get("x", last_pt["minute"]))
        last_val = float(last_pt["metrics"]["drowsyPercentage"])

    # 2. Extract y values for regression
    # Combine actual past points + current projected end to build an active curve
    xs = []
    ys = []
    for d in actual_data:
        xs.append(float(d.get("x", d["minute"])))
        ys.append(float(d["metrics"]["drowsyPercentage"]))
    
    # Adding the live partial minute allows the line to curve continuously 
    # instead of flattening out.
    if current_minute_pred:
        xs.append(last_x)
        ys.append(last_val)

    if len(xs) < 2:
        return [
            {"minute": int(last_x + i + 1),
             "x":      float(last_x + i + 1),
             "label":  f"Min {int(last_x + i + 1)}",
             "predictedDrowsiness": round(last_val, 1)}
            for i in range(future_minutes)
        ]

    try:
        xv     = np.array(xs, dtype=float)
        yv     = np.array(ys, dtype=float)
        # Allow quadratic fit if we have at least 3 points
        degree = min(2, len(xv) - 1)
        poly   = np.poly1d(np.polyfit(xv, yv, degree))

        return [
            {"minute": int(last_x + i + 1),
             "x":      float(last_x + i + 1),
             "label":  f"Min {int(last_x + i + 1)}",
             "predictedDrowsiness": round(float(np.clip(poly(last_x + i + 1), 0, 100)), 1)}
            for i in range(future_minutes)
        ]
    except Exception as e:
        print(f"⚠️  Future prediction error: {e}")
        return []


# ── Current-Minute Live Prediction ───────────────────────────

def predict_current_minute(actual_data: list) -> list:
    """
    Return a per-record running-drowsiness curve for the current
    incomplete minute. Uses fractional `x` to sit between actuals.
    """
    history_list = list(analysis_history)
    partial_count = session_record_count % RECORDS_PER_MINUTE
    
    if partial_count == 0:
        return []

    # Get only the records belonging to the current minute
    partial = history_list[-partial_count:]
    
    n = partial_count
    progress = n / RECORDS_PER_MINUTE

    last_complete_min = ((session_record_count - partial_count) // RECORDS_PER_MINUTE)
    current_min_num = last_complete_min + 1

    # Running cumulative average
    running_pcts = []
    drowsy_so_far = 0
    for idx, rec in enumerate(partial):
        if rec["status"] == "Drowsy":
            drowsy_so_far += 1
        running_pcts.append(round(drowsy_so_far / (idx + 1) * 100, 1))

    # Baseline for slope (either last complete minute or start of this min)
    last_pct = actual_data[-1]["metrics"]["drowsyPercentage"] if actual_data else running_pcts[0]
    current_pct = running_pcts[-1]
    
    # Linear projection to the end of minute
    slope = (current_pct - last_pct) / progress if progress > 0 else 0
    projected_end = float(np.clip(last_pct + slope, 0, 100))

    points = []

    # 1. Starting Point (Baseline)
    # This ensures the orange line always has an origin to draw from.
    if actual_data:
        # Start from the end of the last complete minute
        points.append({
            "label": f"Min {last_complete_min}",
            "x":     float(last_complete_min),
            "cPct":  round(last_pct, 1)
        })
    else:
        # Very first minute - start at exactly x=0
        points.append({
            "label": "Min 0",
            "x":     0.0,
            "cPct":  round(last_pct, 1) if partial_count > 0 else 0.0
        })

    # 2. Intermediate points (fractional x)
    # Downsample if many records
    step = max(1, n // 8)
    for idx in range(0, n, step):
        frac = (idx + 1) / RECORDS_PER_MINUTE
        points.append({
            "label": f"{current_min_num}m{int(frac*60)}s",
            "x":     round(last_complete_min + frac, 3),
            "cPct":  running_pcts[idx]
        })
    
    # Always latest record
    if (n-1) % step != 0:
        frac = n / RECORDS_PER_MINUTE
        points.append({
            "label": f"{current_min_num}m{int(frac*60)}s",
            "x":     round(last_complete_min + frac, 3),
            "cPct":  current_pct
        })

    # 3. Projected end point (integer x)
    if progress < 0.85:
        points.append({
            "label": f"Min {current_min_num}*",
            "x":     float(current_min_num),
            "cPct":  round(projected_end, 1)
        })

    return points


def get_current_minute_metrics():
    """Calculate metrics for the current incomplete minute."""
    history_list = list(analysis_history)
    partial_count = (session_record_count % RECORDS_PER_MINUTE) or (RECORDS_PER_MINUTE if session_record_count > 0 and len(history_list) >= RECORDS_PER_MINUTE else 0)
    
    if partial_count == 0 and not history_list:
        return None
        
    # If partial_count is 0 but we have history, it means we just finished a minute
    # In that case, we should return the metrics of the LAST minute if needed, 
    # but for "current live metrics", 0 is correct if a new minute hasn't started.
    if partial_count == 0: return None
    partial = history_list[-partial_count:]
    return calculate_metrics(partial)


def generate_structured_analysis():
    """Generates structured analysis result for professional display."""
    history_list = list(analysis_history)
    if not history_list:
        return None

    minute_data = get_minute_by_minute_analysis()
    cur_metrics = get_current_minute_metrics()
    
    # Latest reference values
    latest_pct = cur_metrics["drowsyPercentage"] if cur_metrics else (minute_data[-1]["metrics"]["drowsyPercentage"] if minute_data else 0)
    latest_microsleeps = cur_metrics["microSleeps"] if cur_metrics else (minute_data[-1]["metrics"]["microSleeps"] if minute_data else 0)
    latest_streak = cur_metrics["maxConsecutiveDrowsy"] if cur_metrics else (minute_data[-1]["metrics"]["maxConsecutiveDrowsy"] if minute_data else 0)

    # 1. Drowsiness Assessment
    if latest_pct > 50:
        drowsy_status = "CRITICAL"
        drowsy_desc = f"Very high drowsiness ({latest_pct}%). Immediate risk of accident."
    elif latest_pct > 25:
        drowsy_status = "WARNING"
        drowsy_desc = f"Moderate drowsiness ({latest_pct}%). Driver is struggling to stay alert."
    else:
        drowsy_status = "GOOD"
        drowsy_desc = f"Alertness level is normal ({latest_pct}%)."

    # 2. Risk Indicators Assessment
    # We look at microsleeps and streaks
    if latest_microsleeps > 1 or latest_streak >= 5:
        risk_status = "DANGER"
        risk_desc = f"High risk: {latest_microsleeps} microsleeps and a {latest_streak}-record eye-closure streak."
    elif latest_microsleeps > 0 or latest_streak >= 3:
        risk_status = "CAUTION"
        risk_desc = "Early risk signs: Minor streaks or microsleeps detected."
    else:
        risk_status = "MINIMAL"
        risk_desc = "No dangerous patterns detected in the last minute."

    # 3. Overall Trend
    trend_type = "STABLE"
    trend_desc = "Alertness remains consistent."
    if len(minute_data) >= 2:
        prev_pct = minute_data[-1]["metrics"]["drowsyPercentage"]
        prev_prev_pct = minute_data[-2]["metrics"]["drowsyPercentage"]
        if prev_pct > prev_prev_pct + 8:
            trend_type = "WORSENING"
            trend_desc = "Drowsiness is rapidly increasing."
        elif prev_pct < prev_prev_pct - 8:
            trend_type = "IMPROVING"
            trend_desc = "Alertness levels are recovering."

    return {
        "drowsiness": {"status": drowsy_status, "description": drowsy_desc},
        "risk":        {"status": risk_status,   "description": risk_desc},
        "trend":       {"status": trend_type,    "description": trend_desc}
    }

def generate_insights():
    """Generates simple textual alerts (backward compatibility/extra info)."""
    history_list = list(analysis_history)
    if not history_list:
        return ["Waiting for data..."]

    minute_data = get_minute_by_minute_analysis()
    cur_metrics = get_current_minute_metrics()
    insights = []
    
    latest_pct = cur_metrics["drowsyPercentage"] if cur_metrics else (minute_data[-1]["metrics"]["drowsyPercentage"] if minute_data else 0)
    if latest_pct > 50:
        insights.append("🚨 High drowsiness. Stop the vehicle immediately.")
    elif latest_pct > 20:
        insights.append("⚠️ Signs of fatigue increasing.")

    total_microsleeps = sum(m["metrics"]["microSleeps"] for m in minute_data) + (cur_metrics["microSleeps"] if cur_metrics else 0)
    if total_microsleeps > 0:
        insights.append(f"🛑 {total_microsleeps} Microsleeps detected in session.")

    return insights


def determine_music_action(current_status: str, current_emotion: str, structured_data: dict, future_preds: list) -> str:
    """
    Intelligently determine the next action (music track) based on both the
    instantaneous state and overall patterns.
    rather than just the single current frame.
    """
    if not structured_data:
        return 'NO_ACTION'

    drowsy_status = structured_data["drowsiness"]["status"]
    risk_status = structured_data["risk"]["status"]
    trend_status = structured_data["trend"]["status"]

    # Check for immediate danger from future predictions
    future_danger = False
    if future_preds:
        if any(p.get("predictedDrowsiness", 0) > 50 for p in future_preds):
            future_danger = True

    emotion_lower = current_emotion.lower()

    # If currently drowsy, WE MUST WAKE THEM UP, regardless of emotion.
    if current_status == "Drowsy":
        # Overrule mild emotional tracking if they are falling asleep
        return 'PLAY_ALARM' if drowsy_status in ["CRITICAL", "WARNING"] else 'PLAY_MODERATE_ALERT'

    # CRITICAL SEVERITY (But currently awake, meaning they were recently very drowsy)
    if drowsy_status == "CRITICAL" or risk_status == "DANGER" or future_danger:
        if emotion_lower == 'sad':
            return 'PLAY_FAST_HAPPY'
        elif emotion_lower == 'angry':
            return 'PLAY_MODERATE_ALERT'
        elif emotion_lower in ('fear', 'surprise'):
            return 'PLAY_GENTLE_ALERT'
        else:
            return 'PLAY_ALARM'
    
    # MODERATE SEVERITY / WARNING
    elif drowsy_status == "WARNING" or risk_status == "CAUTION" or trend_status == "WORSENING":
        if emotion_lower == 'sad':
            return 'PLAY_UPBEAT_MUSIC'
        elif emotion_lower == 'angry':
            return 'PLAY_CALM_MUSIC'
        elif emotion_lower in ('fear', 'surprise'):
            return 'PLAY_REASSURING_MUSIC'
        else:
            return 'PLAY_MODERATE_ALERT' # Prevent neutral music when they are worsening
            
    # STABLE / GOOD
    return 'NO_ACTION'

