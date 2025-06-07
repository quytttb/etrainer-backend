const express = require("express");
const UserJourneyController = require("../controllers/userJourney");
const { checkLogin } = require("../middlewares/auth");

const userJourneyRouter = express.Router();

userJourneyRouter.post("/", checkLogin, UserJourneyController.createJourney);

userJourneyRouter.get(
  "/current",
  checkLogin,
  UserJourneyController.getCurrentJourney
);

userJourneyRouter.put(
  "/complete-day/:stageIndex/:dayNumber",
  checkLogin,
  UserJourneyController.completeDay
);

module.exports = userJourneyRouter;
