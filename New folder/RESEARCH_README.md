# Research Readme: Hybrid Driver Fatigue System

This file explains the full research logic in plain language, including what the charts mean, what mathematical decisions are used, and how decisions are taken.

## 1. System Goal

The project detects driver fatigue using a hybrid approach:

- Live continuous facial sensing (EAR, MAR, yawning, PERCLOS-like behavior)
- 3-second snapshot deep-learning predictions (drowsiness + emotion)
- Fusion logic that combines both streams into a stable decision

The target is to reduce false alarms while still catching true drowsiness.

## 2. Why There Are Two Chart Speeds

There are two time scales by design:

- Live (1-second): quick monitoring of current risk and physical signals
- Historical (minute): smoother summary for research interpretation

Minute charts exist because backend groups around 20 records per minute (about 60s) to reduce noise and highlight trends.

## 3. Data Streams Used

### Live stream (continuous)

From backend live detector:

- EAR (eye aspect ratio)
- MAR (mouth aspect ratio)
- yawn flag
- model status/confidence from live inference thread

### Snapshot stream (every 3 seconds)

From snapshot probe route:

- drowsiness model output probability
- emotion model output probability
- frontend-provided EAR/MAR/yawn context

## 4. Core Math in Historical Risk (70% Physics, 30% Keras)

In minute-level research metrics, each record computes:

- Physics eyes term: $phys_{eyes}=\min(5\cdot perclos,100)$
- Physics yawn term: $phys_{yawn}=\min(2\cdot yawn\_pct,100)$
- Physics score: $physics=\max(phys_{eyes},phys_{yawn})$
- Keras score: $keras=100$ if drowsy else $0$

Hybrid risk per record:

$$
risk = 0.7\cdot physics + 0.3\cdot keras
$$

This is the meaning of `70% Physics · 30% Keras`.

## 5. Microsleep and Streak Logic

- Microsleep event when $perclos \ge 15\%$
- Fatigue streak counts consecutive risky/drowsy records

These are shown in historical charts and structured analysis.

## 6. Fusion Math (Live + Snapshot)

Both streams are converted to probabilities:

- $p_{live}$ from live observation
- $p_{snap}$ from snapshot observation

Weighted consensus:

$$
p_{weighted}=w_{live}p_{live}+w_{snap}p_{snap}
$$

with default weights:

- $w_{live}=0.60$
- $w_{snap}=0.40$

Physics helper probability from EAR/MAR/yawn/perclos-like terms is added.

Final fused probability uses sigmoid with temporal memory:

$$
p_{fused}(t)=\sigma\left(g\cdot(p_{weighted}-0.5)+\gamma\cdot(p_{fused}(t-1)-0.5)+\delta\cdot(p_{phys}-0.5)\right)
$$

Default parameters:

- $g=2.40$
- $\gamma=0.35$
- $\delta=0.20$

## 7. Stability Rules (Hysteresis + Uncertainty)

To reduce alert flicker:

- ON threshold: $\theta_{on}=0.68$
- OFF threshold: $\theta_{off}=0.42$

Alarm turns ON only above $\theta_{on}$ and turns OFF only below $\theta_{off}$.

Disagreement handling:

- If $|p_{live}-p_{snap}|>0.45$, disagreement rises
- After configured windows, status becomes `Uncertain`

This avoids overreacting when streams conflict.

## 8. Prediction Math

Two prediction outputs are generated:

- Current-minute prediction (running and projected curve)
- Future prediction (next minutes)

Future prediction uses polynomial regression (up to quadratic):

$$
\hat{y}(x)=polyfit(x,y,degree\le2)
$$

Then clipped to valid risk range:

$$
predictedRisk=clip(\hat{y},0,100)
$$

## 9. Does Prediction Affect Decisions?

Yes.

Action logic checks future predictions and sets a `future_danger` flag if any predicted risk exceeds 60.
That flag influences final action selection.

So prediction is not only visual. It actively participates in decision making.

## 10. Emotion Improvement Logic (Live-Assisted)

Raw emotion from model can flicker. System now stabilizes it:

- Rolling buffer window (default 5)
- Weighted majority vote by confidence
- Low-confidence hold (keep previous stable label)
- Yawn-based override: if strong yawn signal, display emotion as `fatigued`

Research transparency is preserved by exposing both:

- `emotion_raw` (model raw)
- `emotion` / display emotion (stabilized)
- `emotion_reason` (why stabilized)

## 11. How To Read Chart Up/Down Movements

### Live Fused Risk chart

- Upward trend: fatigue risk increasing now
- Downward trend: recovery/improvement
- Dashed prediction line above live line: risk expected to worsen
- Dashed prediction line below live line: risk expected to improve
- Confidence envelope (light band): expected reliability width around live fused risk.
- Red uncertainty markers: points where live and snapshot streams disagree enough to trigger uncertainty-safe behavior.

### Live physical chart

- EAR down: eyes more closed
- MAR up: mouth opening more
- Disagreement up: live and snapshot streams disagree more

### Historical minute charts

- Smooth trend-level behavior
- Better for reporting and research summary than second-by-second reaction

## 12. Key Endpoints

- `GET /status`: very fast live status snapshot
- `POST /snapshot_probe`: 3-second model snapshot for hybrid path
- `GET /live_analytics`: 1-second live chart payload (fused + predictions)
- `GET /research`: historical + structured analytics payload

## 13. Live Explanation and Experiment Metrics (Frontend)

Frontend now generates live AI-style explanations from the 1-second stream instead of static text.

It computes and displays:

- Recent risk slope over the latest seconds
- Forecast danger check from predicted peak risk
- Current disagreement and uncertainty status
- Emotion display reason (`majority_vote`, `low_conf_hold`, `yawn_override`, etc.)

Live experiment summary panel computes:

- Average risk percentage over current window
- High-risk windows per hour (proxy metric)
- Uncertain-window percentage
- Drowsy transition count

These are run-time interpretability metrics for research sessions.

## 14. Known Limits

- Emotion model is pretrained and domain mismatch can still exist
- Prediction quality depends on session length and trend stability
- Final proof still requires labeled benchmark datasets and statistical evaluation

## 15. Recommended Next Research Steps

- Log all live and historical outputs to dataset files
- Compute false alarms/hour, miss rate, and confidence intervals
- Run ablation studies:
  - live only
  - snapshot only
  - hybrid fusion
- Tune fusion thresholds and smoothing windows using labeled data
