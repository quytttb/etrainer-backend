const express = require("express");
const router = express.Router();
const { checkLogin } = require("../middlewares/auth");

const { getUserStats, getProgress, getAchievements } = require("../controllers/stats");

router.get("/user-stats", getUserStats);
router.get("/progress", checkLogin, getProgress);
router.get("/achievements", checkLogin, getAchievements);

module.exports = router;
