const { Schema, model } = require("mongoose");

const vocabularyTopicSchema = new Schema(
  {
    topicName: {
      type: String,
      required: true,
      unique: true,
    },
    words: [
      {
        word: {
          type: String,
          required: true,
        },
        meaning: {
          type: String,
          required: true,
        },
        pronunciation: {
          type: String,
          required: true,
        },
        audio: {
          url: {
            type: String,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
        },
      },
    ],
  },
  { timestamps: true }
);

const VocabularyTopic = model("vocabularyTopics", vocabularyTopicSchema);

module.exports = VocabularyTopic;
