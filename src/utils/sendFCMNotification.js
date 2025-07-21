const { admin } = require('../configs/firebase');

const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  try {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      throw new Error("Firebase not initialized");
    }

    const message = {
      token: fcmToken,
      notification: {
        title: title || "📚 Nhắc học tập",
        body: body || "Đã đến giờ học!",
      },
      data: {
        type: "reminder",
        ...data
      },
      android: {
        notification: {
          sound: "default",
          priority: "high"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log("✅ FCM notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ FCM notification failed:", error);
    throw error;
  }
};

const sendFCMToMultipleDevices = async (fcmTokens, title, body, data = {}) => {
  try {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
      throw new Error("Firebase not initialized");
    }

    const message = {
      tokens: fcmTokens,
      notification: {
        title: title || "📚 Nhắc học tập",
        body: body || "Đã đến giờ học!",
      },
      data: {
        type: "reminder",
        ...data
      },
      android: {
        notification: {
          sound: "default",
          priority: "high"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log("✅ FCM multicast sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ FCM multicast failed:", error);
    throw error;
  }
};

module.exports = {
  sendFCMNotification,
  sendFCMToMultipleDevices
};
