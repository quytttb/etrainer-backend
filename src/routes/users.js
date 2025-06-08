const express = require("express");
const UserController = require("../controllers/users");
const { checkLogin, isAdmin } = require("../middlewares/auth");

const userRouter = express.Router();

userRouter.get("/", checkLogin, isAdmin, UserController.getUsers);
userRouter.get("/profile", checkLogin, UserController.getProfile);
userRouter.put("/profile", checkLogin, UserController.updateProfile);
userRouter.delete("/delete-account", checkLogin, UserController.deleteAccount);

userRouter.post(
  "/expo-push-token",
  checkLogin,
  UserController.saveExpoPushToken
);

module.exports = userRouter;
