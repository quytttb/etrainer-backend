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

// 🔧 SECURITY FIX: Use environment variables for CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:5173", "http://localhost:8081"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

connectDB();

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "ETrainer Backend API is running!", timestamp: new Date().toISOString() });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is healthy" });
});

app.use("/api", router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port", PORT));
