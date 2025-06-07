const Reminder = require("../models/reminder");

const ReminderController = {
  createReminder: async (req, res) => {
    try {
      const userId = req.user.id;
      const { hour, minute } = req.body;

      const reminder = await Reminder.findOneAndUpdate(
        { user: userId },
        { hour, minute },
        { new: true, upsert: true }
      );
      return res.status(201).json(reminder);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
};

module.exports = ReminderController;
