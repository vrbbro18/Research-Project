const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '../videos');

/**
 * GET /api/videos/list
 * Get list of available video files
 */
router.get('/list', (req, res) => {
  try {
    if (!fs.existsSync(VIDEOS_DIR)) {
      return res.json({
        success: true,
        files: [],
        message: 'Videos directory does not exist'
      });
    }

    const files = fs.readdirSync(VIDEOS_DIR)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
      })
      .map(file => ({
        name: file,
        path: `/videos/${file}`,
        size: fs.statSync(path.join(VIDEOS_DIR, file)).size
      }));

    res.json({
      success: true,
      files: files,
      count: files.length
    });
  } catch (error) {
    console.error('[VIDEO LIST ERROR]', error);
    res.json({
      success: true,
      files: [],
      error: error.message
    });
  }
});

module.exports = router;

