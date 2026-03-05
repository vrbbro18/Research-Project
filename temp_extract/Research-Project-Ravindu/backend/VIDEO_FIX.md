# Video Not Showing - Quick Fix Guide

## ✅ File Fixed!

Your video file has been renamed from `cctv-stream.mp4.mp4` to `cctv-stream.mp4`

## Steps to See Your Video:

### 1. Restart Backend Server
```bash
cd backend
npm start
```

### 2. Refresh Your Dashboard
- Open your dashboard in browser
- Press F5 or Ctrl+R to refresh
- The video should now appear

### 3. Test Video Directly
Open this URL in your browser to test:
```
http://localhost:3001/videos/cctv-stream.mp4
```

If the video plays here, it will work in the dashboard.

## If Video Still Not Showing:

### Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages
4. Check Network tab to see if video request is failing

### Common Issues:

1. **Server Not Running**
   - Make sure backend is running on port 3001
   - Check: `http://localhost:3001/api/health`

2. **Video Format**
   - Your video is 316KB - very small, might be corrupted
   - Try converting it again or use a different video

3. **CORS Issues**
   - Backend should handle CORS automatically
   - Check server.js has `app.use(cors())`

4. **File Permissions**
   - Make sure file is readable
   - Check file isn't locked by another program

## Video File Info:
- **Location**: `backend/videos/cctv-stream.mp4`
- **Size**: 316,666 bytes (~309 KB)
- **Status**: ✅ File exists and is correctly named

## Next Steps:
1. Restart backend server
2. Refresh dashboard
3. Check browser console for errors
4. Try accessing video URL directly

If still not working, share the browser console errors!

