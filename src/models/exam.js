const { Schema, model } = require("mongoose");
const LESSON_TYPE = require("../constants/lesson");

const examSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    sections: [
      {
        type: {
          type: String,
          required: true,
          enum: Object.values(LESSON_TYPE),
        },
        questions: [
          {
            type: Schema.Types.ObjectId,
            ref: "questions",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Exam = model("exams", examSchema);

module.exports = Exam;
