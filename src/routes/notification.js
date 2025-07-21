const express = require("express");
const { checkLogin } = require("../middlewares/auth");
const NotificationController = require("../controllers/notification");

const notificationRouter = express.Router();

notificationRouter.get(
  "/",
  checkLogin,
  NotificationController.getAllNotifications
);

notificationRouter.post(
  "/",
  checkLogin,
  NotificationController.createNotification
);

notificationRouter.post(
  "/send-push",
  checkLogin,
  NotificationController.sendPushNotification
);

module.exports = notificationRouter;
