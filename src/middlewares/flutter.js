const validateFCMToken = (req, res, next) => {
  const { fcmToken } = req.body;

  if (!fcmToken || typeof fcmToken !== 'string') {
    return res.status(400).json({
      message: "Valid fcmToken is required"
    });
  }

  // Basic FCM token format validation
  if (fcmToken.length < 100) {
    return res.status(400).json({
      message: "Invalid FCM token format"
    });
  }

  next();
};

const validateDeviceInfo = (req, res, next) => {
  const { deviceInfo } = req.body;

  if (!deviceInfo) {
    return res.status(400).json({
      message: "deviceInfo is required"
    });
  }

  const { platform } = deviceInfo;
  const validPlatforms = ['ios', 'android', 'web'];

  if (platform && !validPlatforms.includes(platform)) {
    return res.status(400).json({
      message: "platform must be one of: ios, android, web"
    });
  }

  next();
};

const addFlutterHeaders = (req, res, next) => {
  // Add headers specific to Flutter apps
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Supported-Platforms', 'flutter,ios,android');
  next();
};

module.exports = {
  validateFCMToken,
  validateDeviceInfo,
  addFlutterHeaders
};
