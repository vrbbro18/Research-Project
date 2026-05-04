"""
Quick unit test for research.py prediction functions.
Run from backend/ dir: python test_research.py
"""
import sys, json
sys.path.insert(0, '.')

# Mock the deque with some fake data before importing
from collections import deque
import research

# ── Inject 5 fake records (1st partial minute) ──────────────
research.session_record_count = 0
research.analysis_history.clear()

statuses = ['Drowsy','Awake','Drowsy','Awake','Drowsy']
for s in statuses:
    research.add_record(s, 'neutral', 0.0)

print(f"== After {len(statuses)} records (partial min 1) ==")
ma = research.get_minute_by_minute_analysis()
print(f"  minute_analysis: {json.dumps(ma, indent=2)}")
cmp = research.predict_current_minute(ma)
print(f"  current_minute_prediction ({len(cmp)} pts):")
for pt in cmp:
    print(f"    {pt}")
fp = research.predict_future_drowsiness(ma, cmp)
print(f"  future_predictions ({len(fp)} pts): {fp[:2]}")

# ── Add 15 more records to complete minute 1 ────────────────
print("\n== Adding 15 more records (completing minute 1) ==")
for i in range(15):
    research.add_record('Drowsy' if i % 2 == 0 else 'Awake', 'neutral', 0.0)

ma = research.get_minute_by_minute_analysis()
print(f"  minute_analysis ({len(ma)} complete mins):")
for m in ma:
    print(f"    {m['label']}  x={m['x']}  drowsy%={m['metrics']['drowsyPercentage']}")

# Add 3 records into minute 2
for i in range(3):
    research.add_record('Drowsy', 'neutral', 0.0)

ma = research.get_minute_by_minute_analysis()
cmp = research.predict_current_minute(ma)
print(f"\n== 3 records into minute 2 ==")
print(f"  minute_analysis: {[m['label'] for m in ma]}")
print(f"  current_minute_prediction ({len(cmp)} pts):")
for pt in cmp:
    print(f"    {pt}")
fp = research.predict_future_drowsiness(ma, cmp)
print(f"  future_predictions ({len(fp)} pts): {[p['label'] for p in fp]}")
print("\nDONE - data structure looks correct!" if cmp else "\n❌ current_minute_prediction is EMPTY!")
