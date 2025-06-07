const { Schema, model } = require("mongoose");

const examHistorySchema = new Schema(
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
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    accuracyRate: {
      type: Number,
      required: true,
      default: 0,
    },
    sections: {
      type: Array,
      default: [],
    },
    exam: {},
  },
  { timestamps: true }
);

const ExamHistory = model("examHistory", examHistorySchema);

module.exports = ExamHistory;
