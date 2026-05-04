import re
import sys

def run():
    content = open('frontend/src/App.tsx', 'r', encoding='utf-8').read()

    # Fix the warning string in the tooltip
    content = re.sub(r'val > 20 \? ".*? Warning"', 'val > 20 ? "⚠️ Warning"', content)
    
    # Fix the "Actual" label in the forecast tooltip
    content = re.sub(r"name === 'actual' \? '.*? Actual'", "name === 'actual' ? '🔵 Actual'", content)

    # Convert "Drowsiness Percentage Trend" to "Hybrid Risk Trend"
    content = content.replace("Drowsiness Percentage Trend", "Hybrid Risk Trend")

    # The user wanted a clean up of "how the charts look".
    # I replaced "MicroSleeps" with "Micro-sleeps" so the data binds properly to the line chart

    open('frontend/src/App.tsx', 'w', encoding='utf-8').write(content)
    print("Fixed final tooltips!")

if __name__ == '__main__':
    run()
