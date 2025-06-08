const cron = require("node-cron");
const dayjs = require("dayjs");
const sendPushNotification = require("./utils/sendPushNotification");
const Reminder = require("./models/reminder");
const Notification = require("./models/notification");
const User = require("./models/users");
const PracticeHistory = require("./models/practiceHistory");
const ExamHistory = require("./models/examHistory");

cron.schedule("* * * * *", async () => {
  const now = dayjs();
  const currentHour = now.hour();
  const currentMinute = now.minute();

  console.log(`🕒 Kiểm tra nhắc học lúc ${currentHour}:${currentMinute}`);

  try {
    const usersToNotify = await Reminder.find({
      hour: currentHour,
      minute: currentMinute,
    }).populate("user");

    for (const user of usersToNotify) {
      await sendPushNotification(
        user.user.expoPushToken,
        "⏰ Nhắc học bài!",
        "Bạn đã đặt lịch học bây giờ đó!"
      );

      await new Notification({
        title: "⏰ Nhắc học bài!",
        message: "Bạn đã đặt lịch học bây giờ đó!",
        user: user.user,
      }).save();
    }
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra lịch nhắc:", err);
  }
});

// Cron job: Nhắc nhở học tập nếu không hoạt động > 7 ngày
cron.schedule("* * * * *", async () => {
  const now = dayjs();
  // const sevenDaysAgo = now.subtract(5, "minute");
  const sevenDaysAgo = now.subtract(7, "day");

  try {
    const users = await User.find();
    for (const user of users) {
      // Lấy hoạt động cuối cùng từ practiceHistory
      const lastPractice = await PracticeHistory.findOne({ user: user._id })
        .sort({ endTime: -1 })
        .select("endTime");
      // Lấy hoạt động cuối cùng từ examHistory
      const lastExam = await ExamHistory.findOne({ user: user._id })
        .sort({ endTime: -1 })
        .select("endTime");

      let lastActive = null;
      if (lastPractice && lastExam) {
        lastActive = dayjs(lastPractice.endTime).isAfter(
          dayjs(lastExam.endTime)
        )
          ? dayjs(lastPractice.endTime)
          : dayjs(lastExam.endTime);
      } else if (lastPractice) {
        lastActive = dayjs(lastPractice.endTime);
      } else if (lastExam) {
        lastActive = dayjs(lastExam.endTime);
      }

      // Tìm notification nhắc nhở inactivity gần nhất trong 30 phút qua
      const lastNoti = await Notification.findOne({
        user: user._id,
        title: "📚 Đã lâu bạn chưa học!",
      })
        .sort({ createdAt: -1 })
        .select("createdAt");

      // Chỉ gửi nếu đã từng hoạt động, đã quá 30 phút chưa hoạt động,
      // và chưa gửi thông báo trong 30 phút qua
      if (
        lastActive &&
        lastActive.isBefore(sevenDaysAgo) &&
        (!lastNoti || dayjs(lastNoti.createdAt).isBefore(sevenDaysAgo))
      ) {
        if (user.expoPushToken) {
          await sendPushNotification(
            user.expoPushToken,
            "📚 Đã lâu bạn chưa học!",
            "Hãy quay lại luyện tập để không quên kiến thức nhé!"
          );
        }
        await new Notification({
          title: "📚 Đã lâu bạn chưa học!",
          message: "Hãy quay lại luyện tập để không quên kiến thức nhé!",
          user: user._id,
        }).save();
        // Không cần cập nhật lastInactiveNotification nữa
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra nhắc nhở học tập:", err);
  }
});
