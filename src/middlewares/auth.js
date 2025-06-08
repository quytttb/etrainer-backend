const jwt = require("jsonwebtoken");
const User = require("../models/users");

const checkLogin = (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) return res.status(401).send("Access Denied");

    const [_, selectToken] = token.split(" ");

    jwt.verify(
      selectToken,
      process.env.JWT_SECRET_KEY,
      (error, decodedToken) => {
        if (decodedToken) {
          req.user = decodedToken;
          next();
        }

        if (error) {
          res.status(401).send("Token expired");
        }
      }
    );
  } catch (error) {
    return res.status(400).send("Invalid Token");
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const foundUser = await User.findOne({ email: req.user.email }).exec();

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin = foundUser.role === "ADMIN";
    if (!isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

module.exports = {
  checkLogin,
  isAdmin,
};
