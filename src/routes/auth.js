const express = require("express");
const AuthController = require("../controllers/auth");
const { validate, schemas, sanitizeInput } = require("../middlewares/validation");
const { logAuthAttempt } = require("../middlewares/security");
const { checkLogin } = require("../middlewares/auth");

const authRouter = express.Router();

// Apply input sanitization and auth logging to all auth routes
authRouter.use(sanitizeInput);
authRouter.use(logAuthAttempt);

authRouter.post("/google", AuthController.googleSignIn);
authRouter.post("/login", validate(schemas.userLogin), AuthController.signIn);
authRouter.post("/register", validate(schemas.userRegistration), AuthController.signUp);
authRouter.post("/refresh", AuthController.refreshToken);
authRouter.post("/logout", checkLogin, AuthController.logout);

module.exports = authRouter;
