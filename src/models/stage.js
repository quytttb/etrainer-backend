const mongoose = require('mongoose');
const { Schema } = mongoose;

const stageSchema = new Schema(
  {
    minScore: { type: Number, required: true },
    targetScore: { type: Number, required: true },
    days: [
      {
        dayNumber: { type: Number, required: true },
        questions: [
          {
            type: Schema.Types.ObjectId,
            ref: 'questions',
            required: false,
          },
        ],
        exam: {
          type: Schema.Types.ObjectId,
          ref: 'exams',
          required: false,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stage', stageSchema);
