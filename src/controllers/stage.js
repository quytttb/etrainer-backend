const Stage = require("../models/stage");

const StageController = {
  // Lấy tất cả các stage, có filter theo minScore và maxScore nếu truyền
  getAllStages: async (req, res) => {
    try {
      const { minScore, maxScore } = req.query;

      const filter = {};

      if (minScore && maxScore) {
        filter.$and = [
          { minScore: { $gte: parseInt(minScore) } },
          { targetScore: { $lte: parseInt(maxScore) } },
        ];
      } else if (minScore) {
        filter.minScore = { $gte: parseInt(minScore) };
      } else if (maxScore) {
        filter.targetScore = { $lte: parseInt(maxScore) };
      }

      const stages = await Stage.find(filter)
        .sort("minScore")
        .populate([
          {
            path: "days.questions",
            model: "questions",
          },
          {
            path: "days.exam",
            model: "exams",
          },
        ]);

      return res.status(200).json(stages);
    } catch (error) {
      console.error("Error in getAllStages:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi lấy danh sách lộ trình",
        error: error.message,
      });
    }
  },

  // Lấy stage theo ID
  getStageById: async (req, res) => {
    try {
      const { id } = req.params;

      const stage = await Stage.findById(id).populate([
        {
          path: "days.questions",
          model: "questions",
        },
        {
          path: "days.exam",
          model: "exams",
        },
      ]);

      if (!stage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giai đoạn",
        });
      }

      return res.status(200).json(stage);
    } catch (error) {
      console.error("Error in getStageById:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi lấy thông tin giai đoạn",
        error: error.message,
      });
    }
  },

  // Tạo stage mới
  createStage: async (req, res) => {
    try {
      const { minScore, targetScore, days } = req.body;

      const newStage = new Stage({ minScore, targetScore, days });
      await newStage.save();

      const populatedStage = await Stage.findById(newStage._id).populate([
        {
          path: "days.questions",
          model: "questions",
        },
        {
          path: "days.exam",
          model: "exams",
        },
      ]);

      return res.status(201).json(populatedStage);
    } catch (error) {
      console.error("Error in createStage:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi tạo stage mới",
        error: error.message,
      });
    }
  },

  // Cập nhật stage
  updateStage: async (req, res) => {
    try {
      const { id } = req.params;
      const { minScore, targetScore, days } = req.body;

      // Cập nhật
      await Stage.findByIdAndUpdate(id, { minScore, targetScore, days });

      // Truy vấn lại và populate
      const updatedStage = await Stage.findById(id).populate([
        {
          path: "days.questions",
          model: "questions",
        },
        {
          path: "days.exam",
          model: "exams",
        },
      ]);

      if (!updatedStage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lộ trình",
        });
      }

      return res.status(200).json(updatedStage);
    } catch (error) {
      console.error("Error in updateStage:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi cập nhật lộ trình",
        error: error.message,
      });
    }
  },

  // Xóa stage
  deleteStage: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedStage = await Stage.findByIdAndDelete(id);

      if (!deletedStage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lộ trình",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Xóa lộ trình thành công",
        data: deletedStage,
      });
    } catch (error) {
      console.error("Error in deleteStage:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi xóa lộ trình",
        error: error.message,
      });
    }
  },
};

module.exports = StageController;
