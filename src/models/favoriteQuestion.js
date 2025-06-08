const { Schema, model } = require("mongoose");

const favoriteQuestionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    questionId: {
      type: String,
      ref: "questions",
      required: true,
    },
    question: {
      type: String,
      default: null,
    },
    answer: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Tránh lưu trùng 1 câu hỏi nhiều lần
favoriteQuestionSchema.index({ userId: 1, questionId: 1 }, { unique: true });

const FavoriteQuestion = model("favorite_questions", favoriteQuestionSchema);

module.exports = FavoriteQuestion;
