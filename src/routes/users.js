const express = require("express");
const UserController = require("../controllers/users");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const { validateFCMToken, validateDeviceInfo, addFlutterHeaders } = require("../middlewares/flutter");
const { validate, schemas, sanitizeInput } = require("../middlewares/validation");

const userRouter = express.Router();

// Apply input sanitization and Flutter headers to all user routes
userRouter.use(sanitizeInput);
userRouter.use(addFlutterHeaders);

userRouter.get("/", checkLogin, isAdmin, UserController.getUsers);
userRouter.get("/profile", checkLogin, UserController.getProfile);
userRouter.put("/profile", checkLogin, validate(schemas.updateProfile), UserController.updateProfile);
userRouter.delete("/delete-account", checkLogin, UserController.deleteAccount);

userRouter.post(
  "/expo-push-token",
  checkLogin,
  UserController.saveExpoPushToken
);

// Flutter-specific routes with validation
userRouter.post(
  "/fcm-token",
  checkLogin,
  validateFCMToken,
  UserController.saveFCMToken
);

userRouter.put(
  "/device-info",
  checkLogin,
  validateDeviceInfo,
  UserController.updateDeviceInfo
);

module.exports = userRouter;
