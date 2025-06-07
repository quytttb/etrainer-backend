const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./configs/db");
const router = require("./routes");
require("dotenv").config();
require("./cron");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8081",
      "https://localhost:8081",
      // Allow Expo app connections
      /^https?:\/\/.*\.ngrok\.io$/,
      /^https?:\/\/.*\.vercel\.app$/,
      /^exp:\/\/.*$/,
      /^https?:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);

connectDB();

app.use("/api", router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port", PORT));
