# Audio Files Required

⚠️ **IMPORTANT**: Add these audio files to make the system work:

## Required Files:
1. **alarm.mp3** - Loud alarm sound for drowsy driver (will loop)
2. **happy.mp3** - Fast, happy music to wake up and cheer up
3. **calm.mp3** - Calming music to reduce road rage
4. **upbeat.mp3** - Upbeat music to improve mood and focus

## Quick Solution - Two Options:

### Option 1: Use Audio Generator (FASTEST)
1. Open `audio-generator.html` in your browser (in this folder)
2. Click each button to download placeholder beep sounds
3. Rename downloaded .wav files to .mp3
4. Place them in this folder

### Option 2: Download Real Audio (BEST QUALITY)
Find free audio from these sources:
- **FreeSound.org** - Search: "alarm", "happy music", "calm music"
- **Pixabay.com/music** - Royalty-free music
- **ZapSplat.com** - Free sound effects
- **Bensound.com** - Background music

**After downloading:**
1. Rename files to match required names (alarm.mp3, happy.mp3, etc.)
2. Place them in: `frontend/public/assets/`
3. Restart the dev server: `npm run dev`

## File Format
- Format: MP3 or WAV
- Recommended length: 3-30 seconds
- Quality: 128kbps or higher

## Testing
After adding files, refresh your browser and click "Enable Audio Alerts" button.
