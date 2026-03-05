# CCTV Video Setup Guide

## How to Add Your Downloaded Video

### Step 1: Prepare Your Video File

1. **Place your video file** in the `backend/videos/` directory
2. **Rename it** to one of these names:
   - `cctv-stream.mp4` (recommended - most compatible)
   - `cctv-stream.webm` (alternative format)

### Step 2: Supported Video Formats

The dashboard supports:
- **MP4** (`.mp4`) - Recommended, best browser support
- **WebM** (`.webm`) - Alternative format
- **MOV** (`.mov`) - Can be converted to MP4

### Step 3: Video File Location

```
backend/
  └── videos/
      └── cctv-stream.mp4  ← Place your video here
```

### Step 4: Convert Video (if needed)

If your video is not in MP4 format, you can convert it:

**Using FFmpeg (if installed):**
```bash
ffmpeg -i your-video.mp4 -c:v libx264 -c:a aac cctv-stream.mp4
```

**Or use online converters:**
- https://cloudconvert.com/
- https://convertio.co/

### Step 5: Restart Backend Server

After placing the video file:
```bash
cd backend
npm start
```

### Step 6: View in Dashboard

1. Open your dashboard
2. The video should automatically play in the Live Detection Feed section
3. The video will loop continuously

## Video Requirements

- **Format**: MP4 (H.264 codec recommended)
- **Size**: No limit, but smaller files load faster
- **Resolution**: Any resolution (will scale to fit)
- **Duration**: Any length (will loop automatically)

## Troubleshooting

### Video Not Showing

1. **Check file location:**
   - File should be at: `backend/videos/cctv-stream.mp4`
   - Check file name spelling (case-sensitive)

2. **Check file format:**
   - Ensure it's a valid MP4 file
   - Try opening it in a video player to verify

3. **Check server:**
   - Make sure backend server is running on port 3001
   - Check browser console for errors
   - Try accessing: `http://localhost:3001/videos/cctv-stream.mp4` directly

4. **Check browser:**
   - Some browsers block autoplay with sound
   - Video is set to `muted` to allow autoplay
   - Try refreshing the page

### Video Not Playing

1. **Convert to MP4:**
   - Use FFmpeg or online converter
   - Ensure H.264 codec is used

2. **Check file permissions:**
   - Ensure file is readable
   - Check file isn't corrupted

3. **Try different browser:**
   - Chrome, Firefox, Edge all support MP4
   - Check browser console for errors

## Alternative: Use Different Video File Name

If you want to use a different filename:

1. Update `frontend/src/pages/Dashboard.jsx`:
   ```jsx
   <source src="http://localhost:3001/videos/your-video-name.mp4" type="video/mp4" />
   ```

2. Place your video at: `backend/videos/your-video-name.mp4`

## Multiple Cameras

To switch between multiple videos:

1. Place multiple video files in `backend/videos/`:
   - `camera-01.mp4`
   - `camera-02.mp4`
   - `camera-03.mp4`

2. Update the camera selector in Dashboard.jsx to change the video source dynamically

## Notes

- The video will **loop automatically** when it ends
- Video is **muted by default** to allow autoplay
- Users can **unmute and control** playback using video controls
- The video is served as a **static file** from the backend

