const { Schema, model } = require("mongoose");

const reminderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    hour: {
      type: Number,
      required: true,
    },
    minute: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Reminder = model("reminders", reminderSchema);

module.exports = Reminder;
