const express = require("express");
const AuthController = require("../controllers/auth");

const authRouter = express.Router();

authRouter.post("/google", AuthController.googleSignIn);
authRouter.post("/login", AuthController.signIn);
authRouter.post("/register", AuthController.signUp);

module.exports = authRouter;
