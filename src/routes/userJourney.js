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

userJourneyRouter.put(
  "/start-next-day/:stageIndex/:dayNumber",
  checkLogin,
  UserJourneyController.startNextDay
);

// Routes cho final test
userJourneyRouter.get(
  "/final-test/:stageIndex",
  checkLogin,
  UserJourneyController.getStageFinalTest
);

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

// ✅ NEW: Route for submitting final test
userJourneyRouter.put(
  "/submit-final-test/:stageIndex",
  checkLogin,
  UserJourneyController.submitFinalTest
);

// Route skip stage
userJourneyRouter.post(
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

// ✅ NEW: Get replaced journeys history
userJourneyRouter.get(
  "/replaced",
  checkLogin,
  UserJourneyController.getReplacedJourneys
);

// ✅ NEW: Get all journeys
userJourneyRouter.get(
  "/all",
  checkLogin,
  UserJourneyController.getAllJourneys
);

// Progress tracking route
userJourneyRouter.get(
  "/progress/:userId",
  checkLogin,
  UserJourneyController.getProgress
);

module.exports = userJourneyRouter;
