const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const logger = require('../utils/logger');

class CloudinaryManager {
  constructor() {
    this.initializeCloudinary();
    this.setupStorageConfigs();
  }

  initializeCloudinary() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    logger.info('☁️ Cloudinary initialized');
  }

  setupStorageConfigs() {
    // Image storage configuration
    this.imageStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'etrainer/images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        resource_type: 'image'
      }
    });

    // Audio storage configuration
    this.audioStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'etrainer/audio',
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a'],
        resource_type: 'video' // Cloudinary treats audio as video resource
      }
    });

    // Video storage configuration
    this.videoStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'etrainer/videos',
        allowed_formats: ['mp4', 'avi', 'mov', 'wmv'],
        transformation: [
          { width: 1280, height: 720, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        resource_type: 'video'
      }
    });

    // Document storage configuration  
    this.documentStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'etrainer/documents',
        allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
        resource_type: 'raw'
      }
    });
  }

  // Multer middleware factories
  getImageUpload() {
    return multer({
      storage: this.imageStorage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      }
    });
  }

  getAudioUpload() {
    return multer({
      storage: this.audioStorage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed'), false);
        }
      }
    });
  }

  getVideoUpload() {
    return multer({
      storage: this.videoStorage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only video files are allowed'), false);
        }
      }
    });
  }

  getDocumentUpload() {
    return multer({
      storage: this.documentStorage,
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
        files: 3
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
        }
      }
    });
  }

  // Direct upload methods
  async uploadImage(filePath, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'etrainer/images',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ],
        ...options
      });

      logger.info(`✅ Image uploaded: ${result.public_id}`);
      return result;
    } catch (error) {
      logger.error('❌ Image upload failed:', error.message);
      throw error;
    }
  }

  async uploadAudio(filePath, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'etrainer/audio',
        resource_type: 'video',
        ...options
      });

      logger.info(`✅ Audio uploaded: ${result.public_id}`);
      return result;
    } catch (error) {
      logger.error('❌ Audio upload failed:', error.message);
      throw error;
    }
  }

  async uploadVideo(filePath, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'etrainer/videos',
        resource_type: 'video',
        transformation: [
          { width: 1280, height: 720, crop: 'limit' },
          { quality: 'auto:good' }
        ],
        ...options
      });

      logger.info(`✅ Video uploaded: ${result.public_id}`);
      return result;
    } catch (error) {
      logger.error('❌ Video upload failed:', error.message);
      throw error;
    }
  }

  // URL generation with optimization
  generateImageUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    });
  }

  generateThumbnailUrl(publicId, width = 300, height = 200) {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }

  // Asset management
  async deleteAsset(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      logger.info(`✅ Asset deleted: ${publicId}`);
      return result;
    } catch (error) {
      logger.error('❌ Asset deletion failed:', error.message);
      throw error;
    }
  }

  async getAssetInfo(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });

      return result;
    } catch (error) {
      logger.error('❌ Failed to get asset info:', error.message);
      throw error;
    }
  }

  // Bulk operations
  async deleteAssetsByPrefix(prefix) {
    try {
      const result = await cloudinary.api.delete_resources_by_prefix(prefix);
      logger.info(`✅ Deleted ${result.deleted.length} assets with prefix: ${prefix}`);
      return result;
    } catch (error) {
      logger.error('❌ Bulk deletion failed:', error.message);
      throw error;
    }
  }

  // Analytics and monitoring
  async getUsageStats() {
    try {
      const [usage, transformation] = await Promise.all([
        cloudinary.api.usage(),
        cloudinary.api.usage({ resource_type: 'image' })
      ]);

      return {
        storage: {
          used: usage.storage.used_bytes,
          limit: usage.storage.limit,
          percentage: (usage.storage.used_bytes / usage.storage.limit) * 100
        },
        bandwidth: {
          used: usage.bandwidth.used_bytes,
          limit: usage.bandwidth.limit,
          percentage: (usage.bandwidth.used_bytes / usage.bandwidth.limit) * 100
        },
        requests: usage.requests,
        transformations: transformation.transformations
      };
    } catch (error) {
      logger.error('❌ Failed to get usage stats:', error.message);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await cloudinary.api.ping();
      return {
        status: 'healthy',
        response: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('💔 Cloudinary health check failed:', error.message);
      throw error;
    }
  }

  // Advanced transformations
  generateResponsiveImageSet(publicId, sizes = [480, 768, 1024, 1920]) {
    return sizes.map(size => ({
      width: size,
      url: cloudinary.url(publicId, {
        width: size,
        crop: 'scale',
        quality: 'auto:good',
        fetch_format: 'auto'
      })
    }));
  }

  generateVideoThumbnail(publicId, time = '50%') {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      start_offset: time,
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }
}

module.exports = new CloudinaryManager();
