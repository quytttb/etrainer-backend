const express = require("express");
const GrammarController = require("../controllers/grammars");

const grammarRouter = express.Router();

grammarRouter.get("/", GrammarController.getAll);
grammarRouter.get("/:id", GrammarController.getById);
grammarRouter.post("/", GrammarController.create);
grammarRouter.put("/:id", GrammarController.update);
grammarRouter.delete("/:id", GrammarController.delete);

module.exports = grammarRouter;
