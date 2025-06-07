const { Schema, model } = require("mongoose");

const grammarSchema = new Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    grammars: [
      {
        title: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        examples: [
          {
            type: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Grammar = model("grammars", grammarSchema);

module.exports = Grammar;
