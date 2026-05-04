content = open('frontend/src/App.tsx', 'r', encoding='utf-8').read()

# Find and print the exact bytes around line 575 to diagnose
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'PATTERN WARNING' in line:
        print(f"Line {i+1}: {repr(line)}")

print("--- Done scanning ---")
