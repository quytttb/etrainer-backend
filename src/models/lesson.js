const { Schema, model } = require("mongoose");
const LESSON_TYPE = require("../constants/lesson");

const lessonSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(LESSON_TYPE),
    },
    questions: [
      {
        question: {
          type: String,
          default: null,
        },
        audio: {
          name: {
            type: String,
            default: null,
          },
          url: {
            type: String,
            default: null,
          },
        },
        imageUrl: {
          type: String,
          default: null,
        },
        answers: {
          type: [
            {
              answer: {
                type: String,
                required: true,
              },
              isCorrect: {
                type: Boolean,
                default: false,
              },
            },
          ],
          default: null,
        },
        questions: {
          type: [
            {
              question: {
                type: String,
                required: true,
              },
              answers: [
                {
                  answer: {
                    type: String,
                    required: true,
                  },
                  isCorrect: {
                    type: Boolean,
                    default: false,
                  },
                },
              ],
            },
          ],
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

const Lesson = model("lessons", lessonSchema);

module.exports = Lesson;
