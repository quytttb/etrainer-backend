const { Schema, model } = require("mongoose");
const LESSON_TYPE = require("../constants/lesson");

const practiceHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    lessonType: {
      type: String,
      enum: Object.values(LESSON_TYPE),
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    accuracyRate: {
      type: Number,
      required: true,
      default: 0,
    },
    questionAnswers: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const PracticeHistory = model("practiceHistory", practiceHistorySchema);

module.exports = PracticeHistory;
