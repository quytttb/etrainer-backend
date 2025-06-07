const express = require("express");
const router = express.Router();
const FavoriteQuestion = require("../controllers/favoriteQuestion");

router.get("/", FavoriteQuestion.getAllByUser); // GET /api/favorites?userId=abc123
router.post("/add", FavoriteQuestion.create);   // POST /api/favorites/add
router.delete("/:id", FavoriteQuestion.delete); // DELETE /api/favorites/:id

module.exports = router;
