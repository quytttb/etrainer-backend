const { Schema, model } = require("mongoose");

const userJourneySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    stages: [
      {
        stageId: {
          type: Schema.Types.ObjectId,
          ref: "stages",
          required: true,
        },
        minScore: {
          type: Number,
          required: true,
        },
        targetScore: {
          type: Number,
          required: true,
        },
        days: [
          {
            dayNumber: {
              type: Number,
              required: true,
            },
            started: {
              type: Boolean,
              default: false,
            },
            completed: {
              type: Boolean,
              default: false,
            },
            startedAt: {
              type: Date,
              default: null,
            },
            completedAt: {
              type: Date,
              default: null,
            },
            score: {
              type: Number,
              default: null,
            },
            questions: [
              {
                type: Schema.Types.ObjectId,
                ref: "questions",
              },
            ],
          },
        ],
        finalTest: {
          unlocked: {
            type: Boolean,
            default: false,
          },
          started: {
            type: Boolean,
            default: false,
          },
          completed: {
            type: Boolean,
            default: false,
          },
          startedAt: {
            type: Date,
            default: null,
          },
          completedAt: {
            type: Date,
            default: null,
          },
          score: {
            type: Number,
            default: null,
          },
          passed: {
            type: Boolean,
            default: false,
          },
        },
        started: {
          type: Boolean,
          default: false,
        },
        startedAt: {
          type: Date,
          default: null,
        },
        state: {
          type: String,
          enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"],
          default: "NOT_STARTED",
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    currentStageIndex: {
      type: Number,
      default: 0,
    },
    state: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED", "REPLACED"],
      default: "NOT_STARTED",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    replacedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const UserJourney = model("userJourneys", userJourneySchema);

module.exports = UserJourney;
