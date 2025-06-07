const FavoriteQuestion = require("../models/favoriteQuestion");

const FavoriteQuestionController = {
  // 📥 Lấy tất cả câu hỏi yêu thích của 1 user
  getAllByUser: async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "Missing userId" });
      }

      const favorites = await FavoriteQuestion.find({ userId }).sort("-createdAt");
      res.status(200).json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Error fetching favorites" });
    }
  },

  // ➕ Thêm câu hỏi vào danh sách yêu thích
  create: async (req, res) => {
    try {
      const { userId, questionId, question, answer, category } = req.body;

      const newFavorite = new FavoriteQuestion({
        userId,
        questionId,
        question,
        answer,
        category,
      });

      await newFavorite.save();
      res.status(201).json(newFavorite);
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: "Câu hỏi đã có trong danh sách yêu thích" });
      } else {
        console.error("Create favorite error:", error);
        res.status(500).json({ message: "Error saving favorite" });
      }
    }
  },

  // ✏️ Cập nhật câu hỏi yêu thích
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await FavoriteQuestion.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) {
        return res.status(404).json({ message: "Favorite not found" });
      }

      res.status(200).json(updated);
    } catch (error) {
      console.error("Update favorite error:", error);
      res.status(500).json({ message: "Error updating favorite" });
    }
  },

  // 🗑️ Xoá câu hỏi yêu thích
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await FavoriteQuestion.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Favorite not found" });
      }

      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Delete favorite error:", error);
      res.status(500).json({ message: "Error deleting favorite" });
    }
  }
};

module.exports = FavoriteQuestionController;
