const User = require("../models/users");
const dayjs = require("dayjs");

exports.getUserStats = async (req, res) => {
  try {
    const now = dayjs();
    const sixMonthsAgo = now.subtract(5, "month").startOf("month");

    // Aggregate số user theo năm, tháng
    const usersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo.toDate() } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Hoàn thiện dữ liệu 6 tháng đầy đủ, không bị thiếu tháng nào
    const usersByMonthComplete = [];
    for (let i = 0; i < 6; i++) {
      const date = sixMonthsAgo.add(i, "month");
      const year = date.year();
      const month = date.month() + 1;
      const data = usersByMonth.find(
        (item) => item._id.year === year && item._id.month === month
      );
      usersByMonthComplete.push({
        year,
        month,
        count: data ? data.count : 0,
      });
    }

    // Thống kê giới tính
    const genderAggregation = await User.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    let male = 0,
      female = 0;
    genderAggregation.forEach((item) => {
      if (item._id === "MALE") male = item.count;
      else if (item._id === "FEMALE") female = item.count;
    });

    const total = male + female;

    res.json({
      usersByMonth: usersByMonthComplete,
      genderStats: { male, female, total },
    });
  } catch (error) {
    console.error("Failed to get user stats", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
