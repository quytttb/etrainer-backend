const express = require('express');
const cloudinaryManager = require('../configs/cloudinary');
const { checkLogin } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Image upload endpoint
router.post('/images', checkLogin, (req, res) => {
  const upload = cloudinaryManager.getImageUpload();

  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      logger.error('Image upload error:', err.message);
      return res.status(400).json({
        error: 'Image upload failed',
        message: err.message
      });
    }

    try {
      const uploadedFiles = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        format: file.format || 'unknown'
      }));

      logger.info(`✅ Uploaded ${uploadedFiles.length} images for user ${req.user.id}`);

      res.json({
        message: 'Images uploaded successfully',
        files: uploadedFiles,
        count: uploadedFiles.length
      });
    } catch (error) {
      logger.error('Image processing error:', error.message);
      res.status(500).json({
        error: 'Image processing failed',
        message: error.message
      });
    }
  });
});

// Audio upload endpoint
router.post('/audio', checkLogin, (req, res) => {
  const upload = cloudinaryManager.getAudioUpload();

  upload.single('audio')(req, res, async (err) => {
    if (err) {
      logger.error('Audio upload error:', err.message);
      return res.status(400).json({
        error: 'Audio upload failed',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No audio file provided'
        });
      }

      const audioFile = {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        duration: req.file.duration || null
      };

      logger.info(`✅ Uploaded audio file for user ${req.user.id}`);

      res.json({
        message: 'Audio uploaded successfully',
        file: audioFile
      });
    } catch (error) {
      logger.error('Audio processing error:', error.message);
      res.status(500).json({
        error: 'Audio processing failed',
        message: error.message
      });
    }
  });
});

// Video upload endpoint
router.post('/videos', checkLogin, (req, res) => {
  const upload = cloudinaryManager.getVideoUpload();

  upload.single('video')(req, res, async (err) => {
    if (err) {
      logger.error('Video upload error:', err.message);
      return res.status(400).json({
        error: 'Video upload failed',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No video file provided'
        });
      }

      const videoFile = {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        duration: req.file.duration || null,
        thumbnail: cloudinaryManager.generateVideoThumbnail(req.file.filename)
      };

      logger.info(`✅ Uploaded video file for user ${req.user.id}`);

      res.json({
        message: 'Video uploaded successfully',
        file: videoFile
      });
    } catch (error) {
      logger.error('Video processing error:', error.message);
      res.status(500).json({
        error: 'Video processing failed',
        message: error.message
      });
    }
  });
});

// Document upload endpoint
router.post('/documents', checkLogin, (req, res) => {
  const upload = cloudinaryManager.getDocumentUpload();

  upload.array('documents', 3)(req, res, async (err) => {
    if (err) {
      logger.error('Document upload error:', err.message);
      return res.status(400).json({
        error: 'Document upload failed',
        message: err.message
      });
    }

    try {
      const uploadedFiles = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        format: file.format || 'unknown'
      }));

      logger.info(`✅ Uploaded ${uploadedFiles.length} documents for user ${req.user.id}`);

      res.json({
        message: 'Documents uploaded successfully',
        files: uploadedFiles,
        count: uploadedFiles.length
      });
    } catch (error) {
      logger.error('Document processing error:', error.message);
      res.status(500).json({
        error: 'Document processing failed',
        message: error.message
      });
    }
  });
});

// Delete file endpoint
router.delete('/:publicId', checkLogin, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    const result = await cloudinaryManager.deleteAsset(publicId, resourceType);

    if (result.result === 'ok') {
      logger.info(`✅ Deleted asset ${publicId} for user ${req.user.id}`);
      res.json({
        message: 'File deleted successfully',
        publicId,
        result
      });
    } else {
      res.status(404).json({
        error: 'File not found',
        publicId
      });
    }
  } catch (error) {
    logger.error('File deletion error:', error.message);
    res.status(500).json({
      error: 'File deletion failed',
      message: error.message
    });
  }
});

// Get file info endpoint
router.get('/:publicId/info', checkLogin, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    const info = await cloudinaryManager.getAssetInfo(publicId, resourceType);

    res.json({
      message: 'File info retrieved successfully',
      info: {
        publicId: info.public_id,
        format: info.format,
        resourceType: info.resource_type,
        bytes: info.bytes,
        width: info.width,
        height: info.height,
        createdAt: info.created_at,
        url: info.secure_url
      }
    });
  } catch (error) {
    logger.error('File info error:', error.message);
    res.status(500).json({
      error: 'Failed to get file info',
      message: error.message
    });
  }
});

// Generate optimized image URL
router.post('/optimize-url', checkLogin, async (req, res) => {
  try {
    const { publicId, width, height, quality = 'auto:good' } = req.body;

    if (!publicId) {
      return res.status(400).json({
        error: 'Public ID is required'
      });
    }

    const optimizedUrl = cloudinaryManager.generateImageUrl(publicId, {
      width,
      height,
      quality,
      crop: 'fill'
    });

    res.json({
      message: 'Optimized URL generated',
      originalPublicId: publicId,
      optimizedUrl
    });
  } catch (error) {
    logger.error('URL optimization error:', error.message);
    res.status(500).json({
      error: 'URL optimization failed',
      message: error.message
    });
  }
});

// Get usage statistics (admin only)
router.get('/stats/usage', checkLogin, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const usage = await cloudinaryManager.getUsageStats();

    res.json({
      message: 'Usage statistics retrieved',
      usage
    });
  } catch (error) {
    logger.error('Usage stats error:', error.message);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: error.message
    });
  }
});

module.exports = router;
