content = open('frontend/src/App.tsx', 'r', encoding='utf-8').read()

# These are the exact corrupt sequences from the diagnostic output
bad1 = 'Ãƒ\x8f\x83\xe2\x80\xa6\xa1Ãƒ\x8f\x83\xe2\x80\x9a\xa0 Ãƒ\x8f\x83\xc6\x92\xaf Ãƒ\x8f\x83\xe2\x80\x9a\xb8 Ãƒ\x8f\x83\xe2\x80\x9a '

# Simpler approach: use the exact displayed chars seen in the file view
lines = content.split('\n')
fixed_lines = []
for i, line in enumerate(lines):
    if 'PATTERN WARNING: Initiating therapy track' in line and 'infoText' in line:
        line = '            infoText = "\u26a0\ufe0f PATTERN WARNING: Initiating therapy track & voice alert...";'
    elif 'PATTERN WARNING: Drowsiness streak rising' in line and 'infoText' in line:
        line = '            infoText = "\u26a0\ufe0f PATTERN WARNING: Fatigue streak rising. Scaling volume UP (80%)...";'
    fixed_lines.append(line)

content = '\n'.join(fixed_lines)
open('frontend/src/App.tsx', 'w', encoding='utf-8').write(content)
print("Fixed music warning text!")
