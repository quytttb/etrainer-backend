const express = require("express");
const LessonController = require("../controllers/lessons");

const lessonRouter = express.Router();

lessonRouter.get("/", LessonController.getAll);
lessonRouter.get("/:id", LessonController.getById);
lessonRouter.post("/", LessonController.create);
lessonRouter.put("/:id", LessonController.update);
lessonRouter.delete("/:id", LessonController.delete);

module.exports = lessonRouter;
