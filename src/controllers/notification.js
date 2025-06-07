const Notification = require("../models/notification");

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
};

module.exports = NotificationController;
