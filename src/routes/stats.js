const express = require("express");
const router = express.Router();

const { getUserStats } = require("../controllers/stats");

router.get("/user-stats", getUserStats);

module.exports = router;
