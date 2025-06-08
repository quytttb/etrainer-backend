const express = require("express");
const userRouter = require("./users");
const vocabularyRouter = require("./vocabulary");
const grammarRouter = require("./grammar");
const lessonRouter = require("./lesson");
const questionRouter = require("./question");
const examRouter = require("./exam");
const authRouter = require("./auth");
const reminderRouter = require("./reminder");
const notificationRouter = require("./notification");
const practiceRouter = require("./practice");
const examHistoryRouter = require("./examHistory");
const stageRouter = require("./stage");
const userJourneyRouter = require("./userJourney");
const favoriteRouter = require("./favorites");
const statsRoutes = require("./stats");
const migrationRouter = require("./migration");

const router = express.Router();

router.use("/users", userRouter);
router.use("/vocabulary", vocabularyRouter);
router.use("/grammar", grammarRouter);
router.use("/lessons", lessonRouter);
router.use("/question", questionRouter);
router.use("/exam", examRouter);
router.use("/auth", authRouter);
router.use("/reminder", reminderRouter);
router.use("/notification", notificationRouter);
router.use("/practice", practiceRouter);
router.use("/exam-history", examHistoryRouter);
router.use("/stages", stageRouter);
router.use("/journeys", userJourneyRouter);
router.use("/favorites", favoriteRouter);
router.use("/stats", statsRoutes);
router.use("/migration", migrationRouter);


module.exports = router;
