const { default: axios } = require("axios");
const User = require("../models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const AuthController = {
  googleSignIn: async (req, res) => {
    try {
      const { token } = req.body;

      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = await User.findOne({ email: data.email }).exec();
      if (user) {
        const token = AuthController.generateAccessToken(user);
        const refreshToken = AuthController.generateRefreshToken(user);

        res.json({ token, refreshToken });
      } else {
        const userCount = await User.countDocuments();
        const role = userCount > 0 ? "USER" : "ADMIN";

        const newUser = new User({
          name: data.name,
          email: data.email,
          avatarUrl: data.picture,
          registrationMethod: "GOOGLE",
          role,
        });
        await newUser.save();

        const token = AuthController.generateAccessToken(newUser);
        const refreshToken = AuthController.generateRefreshToken(newUser);

        res.json({ token, refreshToken });
      }
    } catch (error) {
      console.log("🚀 352 ~ googleSignIn: ~ error:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  generateAccessToken: (user) => {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
  },

  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );
  },

  signUp: async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          error: "Name, email, and password are required",
        });
      }

      // Build query conditions, filtering out undefined values
      const queryConditions = [{ email }];
      if (phone) {
        queryConditions.push({ phone });
      }

      const emailOrPhoneExists = await User.findOne({
        $or: queryConditions,
      }).exec();

      if (emailOrPhoneExists) {
        return res.status(400).json({
          error: "Email or phone already exists",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userCount = await User.countDocuments();
      const role = userCount > 0 ? "USER" : "ADMIN";

      const newUser = await new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
      }).save();

      // Return user object without password for security
      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json({
        message: "Register successfully",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  },

  signIn: async (req, res) => {
    const { email, password } = req.body;

    try {
      // check email registered
      const findUser = await User.findOne({ email }).exec();

      if (!findUser) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // check password
      const isPasswordValid = await bcrypt.compare(password, findUser.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = AuthController.generateAccessToken(findUser);
      const refreshToken = AuthController.generateRefreshToken(findUser);

      // Return user object without password for security  
      const userResponse = findUser.toObject();
      delete userResponse.password;

      res.json({
        token,
        refreshToken,
        user: userResponse,
        isAdmin: findUser.role === "ADMIN",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: "Refresh token is required"
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY);

      // Find user
      const user = await User.findById(decoded.id).exec();
      if (!user) {
        return res.status(401).json({
          error: "Invalid refresh token"
        });
      }

      // Generate new tokens
      const newAccessToken = AuthController.generateAccessToken(user);
      const newRefreshToken = AuthController.generateRefreshToken(user);

      res.json({
        token: newAccessToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: "Invalid or expired refresh token"
        });
      }

      res.status(500).json({
        error: error.message
      });
    }
  },

  logout: async (req, res) => {
    try {
      // In a production environment, you would:
      // 1. Add the token to a blacklist/redis cache
      // 2. Or invalidate the token in the database
      // For now, we'll just return success (client-side logout)

      res.json({
        message: "Logged out successfully"
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  },
};

module.exports = AuthController;
