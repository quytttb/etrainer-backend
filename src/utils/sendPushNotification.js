const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendPushNotification = async (expoPushToken, title, body) => {
  // Kiểm tra token hợp lệ
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`❌ Token không hợp lệ: ${expoPushToken}`);
    return;
  }

  // Tạo thông báo
  const messages = [
    {
      to: expoPushToken,
      title: title || "📚 Nhắc học tập",
      body: body || "Đã đến giờ học!",
      data: { type: "reminder" },
    },
  ];

  // Gửi
  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log("✅ Đã gửi notification:", tickets);
  } catch (error) {
    console.error("❌ Gửi thất bại:", error);
  }
};

module.exports = sendPushNotification;
