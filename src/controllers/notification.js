const Notification = require("../models/notification");
const { sendFCMNotification } = require("../utils/sendFCMNotification");
const User = require("../models/users");

const NotificationController = {
  getAllNotifications: async (req, res) => {
    const userId = req.user.id;

    try {
      const notifications = await Notification.find({ user: userId })
        .populate("user")
        .sort({ createdAt: -1 })
        .exec();

      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications", error });
    }
  },

  createNotification: async (req, res) => {
    try {
      const newNotification = await new Notification(req.body).save();
      res.status(201).json(newNotification);
    } catch (error) {
      res.status(500).json({ message: "Error creating notification", error });
    }
  },

  // New method for sending notifications to Flutter apps
  sendPushNotification: async (req, res) => {
    try {
      const { userId, title, body, data } = req.body;

      if (!userId || !title || !body) {
        return res.status(400).json({
          message: "userId, title, and body are required",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let notificationSent = false;
      const results = [];

      // Try FCM first (for Flutter)
      if (user.fcmToken) {
        try {
          await sendFCMNotification(user.fcmToken, title, body, data);
          results.push({ type: "FCM", status: "success" });
          notificationSent = true;
        } catch (error) {
          results.push({ type: "FCM", status: "failed", error: error.message });
        }
      }

      // Fallback to Expo (for existing React Native)
      if (user.expoPushToken && !notificationSent) {
        const sendPushNotification = require("../utils/sendPushNotification");
        try {
          await sendPushNotification(user.expoPushToken, title, body);
          results.push({ type: "Expo", status: "success" });
          notificationSent = true;
        } catch (error) {
          results.push({ type: "Expo", status: "failed", error: error.message });
        }
      }

      // Save notification to database
      const notification = new Notification({
        user: userId,
        title,
        body,
        data: data || {},
        sent: notificationSent,
      });
      await notification.save();

      res.status(200).json({
        message: notificationSent
          ? "Notification sent successfully"
          : "No valid push token found",
        results,
        notification,
      });
    } catch (error) {
      res.status(500).json({ message: "Error sending notification", error });
    }
  },
};

module.exports = NotificationController;
