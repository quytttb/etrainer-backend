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
    origin: ["http://localhost:5173", "http://localhost:8081"],
  })
);

connectDB();

app.use("/api", router);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server is running on port", PORT));
