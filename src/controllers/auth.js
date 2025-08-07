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

        res.json({ token });
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

        res.json({ token });
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
      console.log('🔍 SignIn attempt for email:', email);
      console.log('🔌 Mongoose connection state:', mongoose.connection.readyState);
      console.log('🔧 Global bufferCommands setting:', mongoose.get('bufferCommands'));
      
      // Force set bufferCommands to true for this request
      mongoose.set('bufferCommands', true);
      console.log('🔧 After setting bufferCommands:', mongoose.get('bufferCommands'));
      
      // check email registered
      console.log('🔍 Attempting to find user...');
      const findUser = await User.findOne({ email }).exec();
      console.log('🔍 User query result:', findUser ? 'Found' : 'Not found');

      if (!findUser) {
        console.log('❌ User not found for email:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // check password
      console.log('🔍 Comparing password...');
      const isPasswordValid = await bcrypt.compare(password, findUser.password);

      if (!isPasswordValid) {
        console.log('❌ Invalid password for email:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log('✅ Authentication successful for:', email);
      const token = AuthController.generateAccessToken(findUser);

      // Return user object without password for security  
      const userResponse = findUser.toObject();
      delete userResponse.password;

      res.json({
        token,
        user: userResponse,
        isAdmin: findUser.role === "ADMIN",
      });
    } catch (error) {
      console.error('🚨 SignIn error:', error);
      res.status(500).json({
        error: error.message,
      });
    }
  },
};

module.exports = AuthController;
