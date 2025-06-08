const express = require("express");
const StageController = require("../controllers/stage");
const { checkLogin, isAdmin } = require("../middlewares/auth");

const stageRouter = express.Router();

stageRouter.get("/", checkLogin, StageController.getAllStages);
stageRouter.get("/:id", checkLogin, StageController.getStageById);
stageRouter.post("/", checkLogin, isAdmin, StageController.createStage);
stageRouter.put("/:id", checkLogin, isAdmin, StageController.updateStage);
stageRouter.delete("/:id", checkLogin, isAdmin, StageController.deleteStage);

module.exports = stageRouter;
