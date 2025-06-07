const { default: axios } = require("axios");
const User = require("../models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
      const emailOrPhoneExists = await User.findOne({
        $or: [{ email }, { phone }],
      }).exec();

      if (emailOrPhoneExists) {
        return res.status(400).json({
          message: "Email or phone exists",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userCount = await User.countDocuments();
      const role = userCount > 0 ? "USER" : "ADMIN";

      await new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
      }).save();

      res.status(201).json({
        status: true,
        message: "Register successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
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
        return res.status(404).json({ message: "Unregistered account!" });
      }

      // check password
      const isPasswordValid = await bcrypt.compare(password, findUser.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Wrong password!" });
      }

      const token = AuthController.generateAccessToken(findUser);

      res.json({
        token,
        isAdmin: findUser.role === "ADMIN",
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};

module.exports = AuthController;
