const Reminder = require("../models/reminder");
const User = require("../models/users");
const Notification = require("../models/notification");
const PracticeHistory = require("../models/practiceHistory");
const ExamHistory = require("../models/examHistory");

const UserController = {
  getUsers: async (req, res) => {
    try {
      const users = await User.find().sort("-createdAt").exec();

      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user.toObject();

      // find reminder config
      const userReminder = await Reminder.findOne({ user: userId }).exec();

      res.json({
        ...userWithoutPassword,
        reminder: userReminder,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, phone, dateOfBirth, gender, avatarUrl } = req.body;

      const user = await User.findById(userId).exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name,
          phone,
          dateOfBirth,
          gender,
          avatarUrl,
        },
        { new: true }
      ).exec();

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId).exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await Promise.all([
        User.findByIdAndDelete(userId).exec(),
        Reminder.deleteMany({ user: userId }).exec(),
        Notification.deleteMany({ user: userId }).exec(),
        PracticeHistory.deleteMany({ user: userId }).exec(),
        ExamHistory.deleteMany({ user: userId }).exec(),
      ]);

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  },

  saveExpoPushToken: async (req, res) => {
    try {
      const userId = req.user.id;
      const { expoPushToken } = req.body;

      if (!expoPushToken) {
        return res.status(400).json({ message: "expoPushToken is required" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { expoPushToken },
        { new: true }
      ).exec();

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Expo push token saved", expoPushToken });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error,
      });
    }
  },
};

module.exports = UserController;
