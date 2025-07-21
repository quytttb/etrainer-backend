const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: function () {
        return this.registrationMethod === "EMAIL";
      },
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: String,
      default: null,
    },
    level: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "OTHER",
    },
    registrationMethod: {
      type: String,
      enum: ["GOOGLE", "EMAIL"],
      default: "EMAIL",
    },
    expoPushToken: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    deviceInfo: {
      deviceId: { type: String, default: null },
      platform: { type: String, enum: ["ios", "android", "web"], default: null },
      appVersion: { type: String, default: null }
    },
  },
  { timestamps: true }
);

const User = model("users", userSchema);

module.exports = User;
