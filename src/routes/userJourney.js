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

// Routes cho final test
userJourneyRouter.get(
  "/stage-final-test/:stageIndex",
  checkLogin,
  UserJourneyController.getStageFinalTest
);

userJourneyRouter.post(
  "/start-stage-final-test/:stageIndex",
  checkLogin,
  UserJourneyController.startStageFinalTest
);

userJourneyRouter.put(
  "/complete-stage-final-test/:stageIndex",
  checkLogin,
  UserJourneyController.completeStageFinalTest
);

// Route skip stage
userJourneyRouter.put(
  "/skip-stage/:stageIndex",
  checkLogin,
  UserJourneyController.skipStage
);

// Test route (không cần auth)
userJourneyRouter.get(
  "/test-final-test-status/:stageIndex",
  UserJourneyController.testFinalTestStatus
);

// Debug route (không cần auth)
userJourneyRouter.get(
  "/debug-user/:userId",
  UserJourneyController.debugUserJourney
);

// Debug finalTest status route (không cần auth)
userJourneyRouter.get(
  "/debug-finaltest/:userId",
  UserJourneyController.debugFinalTestStatus
);

module.exports = userJourneyRouter;
