### 📊️ Cấu Trúc Database Collections

### 📊 Tổng Quan Collections
API sử dụng MongoDB với các collections chính sau:

**📈 Thống Kê Database (Cập nhật: 12/8/2025)**
- **Database**: `etrainer` trên MongoDB Atlas
- **Tổng Collections**: 15 collections
- **Tổng Documents**: 522 documents
- **Database Size**: 2.51 MB
- **Storage Size**: 1.40 MB

**📋 Chi Tiết Collections:**
- 👥 **users**: 12 documents (1 admin, 11 users)
- ❓ **questions**: 34 documents (14 IMAGE_DESCRIPTION, 11 ASK_AND_ANSWER, etc.)
- 📊 **exams**: 4 documents
- 🗺️ **userJourneys**: 63 documents (6 active, 5 completed)
- 📚 **vocabularyTopics**: 8 documents (Contracts: 10 words, Marketing: 10 words, etc.)
- 📖 **grammars**: 4 documents (18 rules total)
- ⭐ **favorite_questions**: 1 document
- 📋 **examHistory**: 67 documents
- 🎯 **practiceHistory**: 220 documents (Avg accuracy: 27.02%)
- 🎢 **stages**: 6 documents
- 🔔 **notifications**: 87 documents (87 unread)
- ⏰ **reminders**: 6 documents
- 📝 **lessons**: 1 document

### ⚠️ Lưu Ý Quan Trọng
- Các số liệu thống kê mẫu bên trên chỉ mang tính tham khảo theo môi trường test và có thể thay đổi theo dữ liệu thực tế.
- Final Test của mỗi stage được sinh từ tập hợp câu hỏi của các ngày trong stage (không dùng riêng một loại câu hỏi STAGE_FINAL_TEST trong collection `questions`).

URL Gốc: `https://etrainer-backend.vercel.app/api`

## �️ Cấu Trúc Database Collections

### 📊 Tổng Quan Collections
API sử dụng MongoDB với các collections chính sau:

#### 1. **users** - Quản lý người dùng
```javascript
{
  _id: ---

## 🔐 Yêu Cầu Xác Thực
Hầu hết các endpoint cần xác thực. Thêm JWT token vào header:
```
Authorization: Bearer <your_jwt_token>
```

### 🏷️ Ký Hiệu Trong Tài Liệu
- 🔒 - Endpoint yêu cầu xác thực (JWT token)
- 👑 - Endpoint chỉ dành cho Admin
- 🔒👑 - Endpoint yêu cầu xác thực Admin
- (RESTful) - Endpoint thiết kế theo chuẩn REST ***(Khuyến khích sử dụng)***
- (Legacy) - Endpoint cũ, chỉ để tương thích ngược ***(Sẽ deprecated trong tương lai)***

---
  name: String,                    // Tên đầy đủ (required)
  email: String,                   // Email (required, unique)
  phone: String,                   // Số điện thoại
  password: String,                // Mật khẩu (required nếu registrationMethod = EMAIL)
  avatarUrl: String,              // URL ảnh đại diện
  dateOfBirth: String,            // Ngày sinh
  level: Number,                  // Cấp độ người dùng (default: 0)
  role: String,                   // "USER" | "ADMIN" (default: USER)
  gender: String,                 // "MALE" | "FEMALE" | "OTHER"
  registrationMethod: String,     // "GOOGLE" | "EMAIL"
  expoPushToken: String,          // Token cho Expo push notifications
  fcmToken: String,               // Firebase Cloud Messaging token
  deviceInfo: {
    deviceId: String,             // ID thiết bị
    platform: String,            // "ios" | "android" | "web"
    appVersion: String            // Phiên bản ứng dụng
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **questions** - Ngân hàng câu hỏi
```javascript
{
  _id: ObjectId,
  questionNumber: Number,         // Số thứ tự câu hỏi (unique, auto-increment)
  type: String,                   // Loại câu hỏi (enum LESSON_TYPE)
  question: String,               // Nội dung câu hỏi
  audio: {
    name: String,                 // Tên file audio
    url: String                   // URL file audio
  },
  imageUrl: String,               // URL hình ảnh đi kèm
  answers: [{                     // Danh sách đáp án (cho câu hỏi đơn)
    answer: String,               // Nội dung đáp án
    isCorrect: Boolean            // Đáp án đúng/sai
  }],
  questions: [{                   // Danh sách câu hỏi con (cho bài đọc hiểu)
    question: String,             // Câu hỏi con
    answers: [{
      answer: String,
      isCorrect: Boolean
    }]
  }],
  subtitle: String,               // Phụ đề/gợi ý
  explanation: String,            // Giải thích đáp án
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **exams** - Bài thi
```javascript
{
  _id: ObjectId,
  name: String,                   // Tên bài thi (required)
  duration: Number,               // Thời gian làm bài (phút)
  sections: [{                    // Các phần của bài thi
    type: String,                 // Loại câu hỏi (enum LESSON_TYPE)
    questions: [ObjectId]         // Danh sách ID câu hỏi (ref: questions)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **userJourneys** - Hành trình học tập của người dùng
```javascript
{
  _id: ObjectId,
  user: ObjectId,                 // ID người dùng (ref: users)
  stages: [{                      // Các giai đoạn học tập
    stageId: ObjectId,            // ID giai đoạn (ref: stages)
    minScore: Number,             // Điểm tối thiểu để qua giai đoạn
    targetScore: Number,          // Điểm mục tiêu
    days: [{                      // Các ngày học trong giai đoạn
      dayNumber: Number,          // Số thứ tự ngày
      started: Boolean,           // Đã bắt đầu
      completed: Boolean,         // Đã hoàn thành
      startedAt: Date,            // Thời gian bắt đầu
      completedAt: Date,          // Thời gian hoàn thành
      score: Number,              // Điểm đạt được
      questions: [ObjectId]       // Danh sách câu hỏi (ref: questions)
    }],
    finalTest: {                  // Bài kiểm tra cuối giai đoạn
      unlocked: Boolean,          // Đã mở khóa
      started: Boolean,           // Đã bắt đầu
      completed: Boolean,         // Đã hoàn thành
      startedAt: Date,
      completedAt: Date,
      score: Number,
      passed: Boolean             // Đã vượt qua
    },
    started: Boolean,
    startedAt: Date,
    state: String,                // "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
    completedAt: Date
  }],
  currentStageIndex: Number,      // Chỉ số giai đoạn hiện tại
  state: String,                  // Trạng thái tổng thể
  startedAt: Date,
  completedAt: Date,
  replacedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **vocabularyTopics** - Chủ đề từ vựng
```javascript
{
  _id: ObjectId,
  topicName: String,              // Tên chủ đề (required, unique)
  words: [{                       // Danh sách từ vựng
    word: String,                 // Từ vựng
    meaning: String,              // Nghĩa
    pronunciation: String,        // Phát âm
    audio: {
      url: String,                // URL file audio
      name: String                // Tên file audio
    }
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **grammars** - Ngữ pháp
```javascript
{
  _id: ObjectId,
  topic: String,                  // Chủ đề ngữ pháp (required)
  grammars: [{                    // Danh sách quy tắc ngữ pháp
    title: String,                // Tiêu đề quy tắc
    content: String,              // Nội dung quy tắc
    examples: [String]            // Ví dụ minh họa
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. **favorite_questions** - Câu hỏi yêu thích
```javascript
{
  _id: ObjectId,
  userId: ObjectId,               // ID người dùng (ref: users)
  questionId: ObjectId,           // ID câu hỏi (ref: questions)
  question: String,               // Nội dung câu hỏi
  answer: String,                 // Đáp án
  category: String,               // Danh mục
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. **examHistory** - Lịch sử bài thi
```javascript
{
  _id: ObjectId,
  user: ObjectId,                 // ID người dùng (ref: users)
  startTime: Date,                // Thời gian bắt đầu
  endTime: Date,                  // Thời gian kết thúc
  totalQuestions: Number,         // Tổng số câu hỏi
  correctAnswers: Number,         // Số câu trả lời đúng
  accuracyRate: Number,           // Tỷ lệ chính xác
  sections: Array,                // Chi tiết từng phần
  exam: Object,                   // Thông tin bài thi
  createdAt: Date,
  updatedAt: Date
}
```

#### 9. **practiceHistory** - Lịch sử luyện tập
```javascript
{
  _id: ObjectId,
  user: ObjectId,                 // ID người dùng (ref: users)
  startTime: Date,                // Thời gian bắt đầu
  endTime: Date,                  // Thời gian kết thúc
  lessonType: String,             // Loại bài học (enum LESSON_TYPE)
  totalQuestions: Number,         // Tổng số câu hỏi
  correctAnswers: Number,         // Số câu trả lời đúng
  accuracyRate: Number,           // Tỷ lệ chính xác
  questionAnswers: Array,         // Chi tiết câu trả lời
  createdAt: Date,
  updatedAt: Date
}
```

#### 10. **stages** - Giai đoạn học tập
```javascript
{
  _id: ObjectId,
  minScore: Number,               // Điểm tối thiểu
  targetScore: Number,            // Điểm mục tiêu
  days: [{                        // Các ngày trong giai đoạn
    dayNumber: Number,            // Số thứ tự ngày
    questions: [ObjectId],        // Danh sách câu hỏi (ref: questions)
    exam: ObjectId                // Bài thi (ref: exams)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 11. **notifications** - Thông báo
```javascript
{
  _id: ObjectId,
  title: String,                  // Tiêu đề thông báo (required)
  message: String,                // Nội dung thông báo (required)
  user: ObjectId,                 // ID người dùng (ref: users)
  isRead: Boolean,                // Đã đọc (default: false)
  createdAt: Date,
  updatedAt: Date
}
```

#### 12. **reminders** - Nhắc nhở
```javascript
{
  _id: ObjectId,
  user: ObjectId,                 // ID người dùng (ref: users)
  hour: Number,                   // Giờ nhắc nhở (required)
  minute: Number,                 // Phút nhắc nhở (required)
  createdAt: Date,
  updatedAt: Date
}
```

#### 13. **lessons** - Bài học
```javascript
{
  _id: ObjectId,
  type: String,                   // Loại bài học (enum LESSON_TYPE)
  questions: [{                   // Danh sách câu hỏi trong bài học
    question: String,             // Nội dung câu hỏi
    audio: {
      name: String,               // Tên file audio
      url: String                 // URL file audio
    },
    imageUrl: String,             // URL hình ảnh
    answers: [{                   // Danh sách đáp án
      answer: String,
      isCorrect: Boolean
    }],
    questions: [{                 // Câu hỏi con (cho bài đọc hiểu)
      question: String,
      answers: [{
        answer: String,
        isCorrect: Boolean
      }]
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 🏷️ Enum Types
```javascript
LESSON_TYPE = {
  IMAGE_DESCRIPTION: "IMAGE_DESCRIPTION",           // Mô tả hình ảnh
  ASK_AND_ANSWER: "ASK_AND_ANSWER",                // Hỏi và đáp
  CONVERSATION_PIECE: "CONVERSATION_PIECE",         // Đoạn hội thoại
  SHORT_TALK: "SHORT_TALK",                        // Bài nói chuyện ngắn
  FILL_IN_THE_BLANK_QUESTION: "FILL_IN_THE_BLANK_QUESTION", // Điền vào câu
  FILL_IN_THE_PARAGRAPH: "FILL_IN_THE_PARAGRAPH",  // Điền vào đoạn văn
  READ_AND_UNDERSTAND: "READ_AND_UNDERSTAND",       // Đọc hiểu đoạn văn
  STAGE_FINAL_TEST: "STAGE_FINAL_TEST"             // Bài test tổng kết giai đoạn
}
```

---

## �🔐 Yêu Cầu Xác Thực
Hầu hết các endpoint cần xác thực. Thêm JWT token vào header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📱 1. Routes Xác Thực (`/api/auth`)

### POST `/api/auth/register`
Đăng ký người dùng mới
```json
{
  "name": "string",
  "email": "string", 
  "password": "string",
  "phone": "string (optional)"
}
```

### POST `/api/auth/login`
Đăng nhập người dùng
```json
{
  "email": "string",
  "password": "string"
}
```

### POST `/api/auth/google`
Đăng nhập bằng Google
```json
{
  "idToken": "string"
}
```

### POST `/api/auth/refresh`
Làm mới access token khi hết hạn
```json
{
  "refreshToken": "string"
}
```

**Response**: Trả về token mới và refreshToken mới
```json
{
  "token": "string",
  "refreshToken": "string"
}
```

---

## 👤 2. Routes Người Dùng (`/api/users`)

### GET `/api/users/me` 🔒 (RESTful)
Lấy thông tin cá nhân người dùng hiện tại

### PUT `/api/users/me` 🔒 (RESTful)
Cập nhật thông tin cá nhân
```json
{
  "name": "string",
  "phone": "string",
  "dateOfBirth": "string",
  "gender": "MALE | FEMALE | OTHER",
  "avatarUrl": "string",
  "updatedAt": "Date (for optimistic concurrency)"
}
```

### DELETE `/api/users/me` 🔒 (RESTful)
Xóa tài khoản người dùng

### GET `/api/users/profile` 🔒 (Legacy)
Lấy thông tin cá nhân người dùng hiện tại

### PUT `/api/users/profile` 🔒 (Legacy)
Cập nhật thông tin cá nhân

### DELETE `/api/users/delete-account` 🔒 (Legacy)
Xóa tài khoản người dùng

### POST `/api/users/fcm-token` 🔒
Lưu FCM token cho push notification
```json
{
  "fcmToken": "string"
}
```

### PUT `/api/users/device-info` 🔒
Cập nhật thông tin thiết bị
```json
{
  "deviceId": "string",
  "deviceType": "android",
  "osVersion": "string",
  "appVersion": "string"
}
```

### GET `/api/users/export-data` 🔒 (Backup - CÓ thực sự)
Xuất toàn bộ dữ liệu người dùng để sao lưu

**Response thực tế:**
```json
{
  "user": { /* user object without password */ },
  "reminders": [...],
  "notifications": [...],
  "practiceHistories": [...],  // Field name khác
  "examHistories": [...],
  "exportedAt": "2025-01-XX...",
  "version": 1
}
```

### POST `/api/users/import-data` 🔒 (Restore - CÓ thực sự)
Khôi phục dữ liệu người dùng từ file backup
```json
{
  "reminders": [...],
  "notifications": [...], 
  "practiceHistories": [...],
  "examHistories": [...]
}
```

**⚠️ Lưu ý:**
- Route thực tế là `/export-data` và `/import-data`
- **KHÔNG** phải `/backup` và `/restore`
- Structure khác với documentation ban đầu

---

## 📚 3. Routes Từ Vựng (`/api/vocabulary`)

### GET `/api/vocabulary`
Lấy tất cả chủ đề từ vựng (có cache)

### GET `/api/vocabulary/:id`
Lấy chủ đề từ vựng theo ID

---

## 📖 4. Routes Ngữ Pháp (`/api/grammar`)

### GET `/api/grammar`
Lấy tất cả quy tắc ngữ pháp (có cache)

### GET `/api/grammar/:id`
Lấy quy tắc ngữ pháp theo ID

---

## 📝 5. Routes Bài Học (`/api/lessons`)

### GET `/api/lessons`
Lấy tất cả bài học

### GET `/api/lessons/:id`
Lấy bài học theo ID

---

## ❓ 6. Routes Câu Hỏi (`/api/question`) 🔒

### GET `/api/question` 🔒
Lấy danh sách câu hỏi (đã hỗ trợ phân trang, có cache)

**Query Parameters:**
- `page` (optional): Số trang, mặc định = 1
- `limit` (optional): Số phần tử mỗi trang, mặc định = 100, tối đa = 100
- `type` (optional): Lọc theo loại câu hỏi (LESSON_TYPE enum)
- `sort` (optional): Ví dụ `-createdAt` (mới nhất trước), hỗ trợ nhiều field: `-createdAt,type`
- `fields` (optional): Chọn field trả về, ví dụ: `question,type,createdAt`

**Ví dụ:**
```
GET /api/question?page=2&limit=10&type=IMAGE_DESCRIPTION&sort=-createdAt&fields=question,type
```

**Response:**
```json
{
  "data": [ /* questions */ ],
  "questions": [ /* giữ tương thích cũ */ ],
  "count": 100,
  "pagination": {
    "currentPage": 2,
    "totalPages": 15,
    "totalItems": 150,
    "itemsPerPage": 100,
    "hasNextPage": true,
    "hasPrevPage": true,
    "nextPage": 3,
    "prevPage": 1
  }
}
```

### GET `/api/question/:id` 🔒
Lấy câu hỏi theo ID

---

## 📊 7. Routes Bài Thi (`/api/exam`) 🔒

### GET `/api/exam`
Lấy tất cả bài thi

### GET `/api/exam/:id`
Lấy bài thi theo ID

---

## 🎯 8. Routes Luyện Tập (`/api/practice`) 🔒

### POST `/api/practice/sessions` 🔒 (RESTful)
Bắt đầu phiên luyện tập mới
```json
{
  "topicId": "string",
  "questionCount": number
}
```

### POST `/api/practice/history` 🔒 (RESTful)
Tạo lịch sử luyện tập (nộp bài)
```json
{
  "answers": [
    {
      "questionId": "string",
      "selectedAnswer": "string",
      "isCorrect": boolean
    }
  ],
  "totalScore": number,
  "timeSpent": number
}
```

### GET `/api/practice/history` 🔒
Lấy lịch sử luyện tập của người dùng hiện tại

### GET `/api/practice/history/:id` 🔒
Lấy phiên luyện tập theo ID

---

## 🗺️ 9. Routes Hành Trình Học Tập (`/api/journeys`) 🔒

### POST `/api/journeys` 🔒 (RESTful)
Tạo hành trình mới

### GET `/api/journeys/current` 🔒
Lấy hành trình hiện tại của người dùng

### GET `/api/journeys/all` 🔒
Lấy tất cả hành trình của người dùng

### POST `/api/journeys/stages/:stageIndex/days/:dayNumber/start` 🔒 (RESTful)
Bắt đầu một ngày trong hành trình
```json
{
  "score": number
}
```

### POST `/api/journeys/stages/:stageIndex/days/:dayNumber/completions` 🔒 (RESTful)
Hoàn thành một ngày trong hành trình
```json
{
  "score": number
}
```

### GET `/api/journeys/stages/:stageIndex/final-test` 🔒 (RESTful)
Lấy bài kiểm tra cuối giai đoạn

### POST `/api/journeys/stages/:stageIndex/final-test/sessions` 🔒 (RESTful)
Bắt đầu bài kiểm tra cuối giai đoạn

### POST `/api/journeys/stages/:stageIndex/final-test/submissions` 🔒 (RESTful)
Nộp bài kiểm tra cuối giai đoạn
```json
{
  "answers": [...],
  "score": number
}
```

### POST `/api/journeys/stages/:stageIndex/final-test/submissions/simple` 🔒 (RESTful)
Nộp bài kiểm tra cuối giai đoạn (phiên bản đơn giản)

### POST `/api/journeys/stages/:stageIndex/skip` 🔒 (RESTful)
Bỏ qua giai đoạn hiện tại

*Alias: Các endpoint này cũng có thể truy cập qua `/api/userJourney` ***(Legacy - không khuyến khích)****

---

## ⭐ 10. Routes Yêu Thích (`/api/favorites`) 🔒

### GET `/api/favorites` 🔒 (RESTful)
Lấy các câu hỏi yêu thích của người dùng hiện tại (userId lấy từ JWT)

### POST `/api/favorites` 🔒 (RESTful)
Thêm câu hỏi vào danh sách yêu thích
```json
{
  "questionId": "string",
  "question": "string",
  "answer": "string",
  "category": "string"
}
```

### PUT `/api/favorites/:id` 🔒 (RESTful)
Cập nhật câu hỏi yêu thích
```json
{
  "question": "string",
  "answer": "string",
  "category": "string"
}
```

### DELETE `/api/favorites/:id` 🔒 (RESTful)
Xóa khỏi danh sách yêu thích

---

## 📈 11. Routes Thống Kê (`/api/stats`) 🔒

### GET `/api/stats/user-stats` 🔒 (RESTful)
Lấy thống kê của người dùng hiện tại (từ JWT)

---

## 🔔 12. Routes Thông Báo (`/api/notification`) 🔒

### GET `/api/notification`
Lấy tất cả thông báo của người dùng hiện tại

### POST `/api/notification`
Tạo thông báo mới
```json
{
  "title": "string",
  "message": "string",
  "user": "string"
}
```

### POST `/api/notification/send-push`
Gửi push notification
```json
{
  "title": "string",
  "message": "string",
  "userId": "string"
}
```

---

## ⏰ 13. Routes Nhắc Nhở (`/api/reminder`) 🔒

### POST `/api/reminder`
Tạo nhắc nhở mới
```json
{
  "hour": number,
  "minute": number
}
```

---

## 📋 14. Routes Lịch Sử Thi (`/api/exam-history`) 🔒

### GET `/api/exam-history` 🔒 (RESTful)
Lấy lịch sử các bài thi của người dùng hiện tại

### GET `/api/exam-history/:id` 🔒 (RESTful)
Lấy chi tiết lịch sử thi theo ID

### POST `/api/exam-history` 🔒 (RESTful)
Tạo lịch sử thi mới (nộp bài thi)
```json
{
  "startTime": "Date",
  "endTime": "Date", 
  "totalQuestions": number,
  "correctAnswers": number,
  "accuracyRate": number,
  "sections": [],
  "exam": {}
}
```

*Alias: Các endpoint này cũng có thể truy cập qua `/api/examHistory` ***(Legacy - không khuyến khích)****

---

## 🎢 15. Routes Giai Đoạn (`/api/stages`) 🔒

### GET `/api/stages`
Lấy tất cả giai đoạn học tập

### GET `/api/stages/:id`
Lấy giai đoạn theo ID

### POST `/api/stages`
Tạo giai đoạn mới
```json
{
  "minScore": number,
  "targetScore": number,
  "days": [{
    "dayNumber": number,
    "questions": ["string"],
    "exam": "string"
  }]
}
```

---

## 📤 16. Routes Upload (`/api/uploads`) 🔒

### POST `/api/uploads/images`
Upload hình ảnh (hỗ trợ multiple files)
- Content-Type: multipart/form-data
- Field name: images
- Max files: 5

### POST `/api/uploads/audio`
Upload file âm thanh
- Content-Type: multipart/form-data
- Field name: audio

### POST `/api/uploads/videos`
Upload video
- Content-Type: multipart/form-data
- Field name: videos

### DELETE `/api/uploads/:publicId`
Xóa file đã upload theo publicId

---

## 🔧 17. Routes Hệ Thống (`/api/system`)

### GET `/api/system/health`
Kiểm tra tình trạng hệ thống

### GET `/api/system/status`
Trạng thái hệ thống

### GET `/api/system/leaderboard`
Bảng xếp hạng người dùng

### GET `/api/system/cache/stats` 🔒👑
Thống kê cache (Admin only)

### POST `/api/system/cache/clear` 🔒👑
Xóa cache (Admin only)

### GET `/api/system/database/stats` 🔒👑
Thống kê database (Admin only)

### GET `/api/system/performance` 🔒👑
Thống kê hiệu suất (Admin only)

### GET `/api/system/cluster/status` 🔒👑
Trạng thái cluster (Admin only)

### GET `/api/system/jobs/stats` 🔒👑
Thống kê background jobs (Admin only)

### POST `/api/system/jobs/schedule` 🔒👑
Lên lịch job mới (Admin only)

### GET `/api/system/cloudinary/usage` 🔒👑
Thống kê sử dụng Cloudinary (Admin only)

### GET `/api/system/metrics` 🔒👑
Metrics hệ thống (Admin only)

---

## 🔄 18. Routes Migration (`/api/migration`) 🔒👑

### POST `/api/migration/run`
Chạy migration (Admin only)

### GET `/api/migration/status`
Kiểm tra trạng thái migration (Admin only)

---

## 📱 Hướng Dẫn Tích Hợp Android

---

## 🔄 API Improvements Summary (2025)

### ✅ 1. Authentication & JWT Enhancements
- **✅ Refresh Token Flow**: Added `POST /api/auth/refresh` endpoint for seamless token renewal
- **✅ JWT-based User ID**: All user-specific endpoints now extract `userId` from JWT instead of requiring it in query/body
- **✅ Consistent Auth**: All protected routes require `Authorization: Bearer <token>` header

### ✅ 2. RESTful API Design
- **✅ Favorites**: 
  - `GET /api/favorites` (từ JWT), `POST /api/favorites`, `PUT /api/favorites/:id`, `DELETE /api/favorites/:id`
  - Removed non-RESTful `/add` verb, removed `userId` from query params
- **✅ Users**: Added RESTful aliases `GET/PUT/DELETE /api/users/me`
- **✅ Practice**: Added RESTful `POST /api/practice/sessions`, `POST /api/practice/history`
- **✅ User Journey**: Converted to sub-resource pattern:
  - `POST /api/journeys/stages/:stageIndex/days/:dayNumber/start`
  - `POST /api/journeys/stages/:stageIndex/days/:dayNumber/completions`
  - `GET /api/journeys/stages/:stageIndex/final-test`
  - `POST /api/journeys/stages/:stageIndex/final-test/sessions`
  - `POST /api/journeys/stages/:stageIndex/final-test/submissions`
- **✅ Exam History**: Added RESTful `GET/POST /api/exam-history/:id`
- **✅ Statistics**: Changed to `GET /api/stats/user-stats` (JWT-based)

### ✅ 3. Optimized API Responses
- **✅ Full Object Returns**: All `POST` and `PUT` operations now return the complete created/updated object
- **✅ Optimistic Concurrency**: Added `updatedAt` field support for profile updates to handle multi-device conflicts

### ✅ 4. Data Backup & Multi-device Support
- **✅ Backup/Restore**: Added `GET /api/users/export-data` and `POST /api/users/import-data` for data portability
- **✅ Conflict Resolution**: Basic optimistic concurrency control for profile updates

### ✅ 5. Backward Compatibility
- **✅ Legacy Routes**: Maintained existing endpoints for backward compatibility
- **✅ Gradual Migration**: Both old and new endpoints work simultaneously

### ⚠️ Migration Recommendations
- **🚀 Ưu tiên sử dụng**: Các endpoint được đánh dấu **(RESTful)** cho tất cả development mới
- **⏰ Deprecated Schedule**: Các endpoint **(Legacy)** sẽ được deprecated trong Q2 2025
- **🔄 Migration Path**: 
  1. Chuyển sang RESTful endpoints ngay lập tức cho các tính năng mới
  2. Dần dần migrate các endpoint cũ trong Q1 2025
  3. Remove hoàn toàn legacy endpoints trong Q2 2025

---

## 🔧 12. Routes Hệ Thống (`/api/system`)

### GET `/api/system/health`
Kiểm tra tình trạng hệ thống

### GET `/api/system/status`
Trạng thái hệ thống

---

## 📱 Hướng Dẫn Tích Hợp Android

### 1. **Cài Đặt Network**
```kotlin
// Thêm vào AndroidManifest.xml
<uses-permission android:name="android.permission.INTERNET" />

// Sử dụng Retrofit cho API calls
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
```

### 2. **Luồng Xác Thực**
1. Gọi `/api/auth/login` hoặc `/api/auth/register`
2. Lưu JWT token vào SharedPreferences
3. Thêm token vào tất cả các request tiếp theo

### 3. **Xử Lý Lỗi**
API trả về các mã trạng thái HTTP chuẩn:
- `200` - Thành công
- `400` - Yêu cầu không hợp lệ
- `401` - Chưa xác thực
- `403` - Không có quyền truy cập
- `404` - Không tìm thấy
- `500` - Lỗi server

**Cấu trúc JSON phản hồi lỗi:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Dữ liệu đầu vào không hợp lệ",
  "details": {
    "field": "email",
    "code": "INVALID_EMAIL_FORMAT"
  }
}
```

**Ví dụ các loại lỗi phổ biến:**
```json
// 400 - Bad Request
{
  "success": false,
  "error": "VALIDATION_ERROR", 
  "message": "Email không hợp lệ"
}

// 401 - Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Token không hợp lệ hoặc đã hết hạn"
}

// 403 - Forbidden
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Không có quyền truy cập tài nguyên này"
}

// 404 - Not Found
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Không tìm thấy tài nguyên"
}

// 500 - Internal Server Error
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Đã xảy ra lỗi hệ thống"
}
```

### Ví dụ lỗi cụ thể theo endpoint

#### POST `/api/auth/register` (email/phone trùng)
```json
// 400 Duplicate Email
{
  "error": "DUPLICATE_EMAIL",
  "message": "Email đã tồn tại",
  "details": { "field": "email" }
}

// 400 Duplicate Phone
{
  "error": "DUPLICATE_PHONE",
  "message": "Số điện thoại đã tồn tại",
  "details": { "field": "phone" }
}
```

### 4. **Push Notifications**
1. Lấy FCM token trong ứng dụng Android
2. Gửi token đến `/api/users/fcm-token`
3. Server sẽ gửi thông báo cho nhắc nhở luyện tập, v.v.

### 5. **Caching**
Một số endpoint có cache trên server:
- Chủ đề từ vựng (1 giờ)
- Quy tắc ngữ pháp (1 giờ)  
- Câu hỏi (10 phút)

Nên implement client-side caching để có hiệu suất tốt hơn.

---

## 🚀 Bắt Đầu

1. **URL Gốc**: `https://etrainer-backend.vercel.app/api`
2. **Xác thực**: JWT tokens
3. **Content-Type**: `application/json`
4. **Rate Limiting**: API có giới hạn tốc độ để bảo mật

### Ví Dụ API Call Android (Cập nhật RESTful - Thực tế Implementation):
```kotlin
interface ETrainerAPI {
    // Authentication - Direct response, NO wrapper
    @POST("auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<LoginResponse>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body refreshRequest: RefreshTokenRequest): Response<RefreshTokenResponse>
    
    // User Profile (RESTful aliases CÓ trong code)
    @GET("users/me")
    suspend fun getProfile(@Header("Authorization") token: String): Response<UserProfileResponse>
    
    @PUT("users/me") 
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body profile: UpdateProfileRequest
    ): Response<User>
    
    // Questions - ĐÃ hỗ trợ pagination (page, limit, sort, fields)
    @GET("question")
    suspend fun getQuestions(
        @Header("Authorization") token: String,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null,
        @Query("type") type: String? = null,
        @Query("sort") sort: String? = null,
        @Query("fields") fields: String? = null
    ): Response<QuestionListResponse> // { data: [...], questions: [...], count: number, pagination: {...} }
    
    @GET("question/{id}")
    suspend fun getQuestion(
        @Header("Authorization") token: String,
        @Path("id") questionId: String
    ): Response<Question>
    
    // Favorites - RESTful, userId lấy từ JWT
    @GET("favorites")
    suspend fun getFavorites(
        @Header("Authorization") token: String
    ): Response<List<FavoriteQuestion>>
    
    @POST("favorites")
    suspend fun addFavorite(
        @Header("Authorization") token: String,
        @Body favorite: CreateFavoriteRequest
    ): Response<FavoriteQuestion>
    
    @DELETE("favorites/{id}")
    suspend fun deleteFavorite(
        @Header("Authorization") token: String,
        @Path("id") favoriteId: String
    ): Response<MessageResponse>
    
    // Vocabulary & Grammar - Direct responses
    @GET("vocabulary")
    suspend fun getVocabularyTopics(): Response<List<VocabularyTopic>>
    
    @GET("grammar")
    suspend fun getGrammarRules(): Response<List<Grammar>>
    
    // Backup & Restore - Thực tế
    @GET("users/export-data")
    suspend fun exportUserData(@Header("Authorization") token: String): Response<ActualBackupData>
    
    @POST("users/import-data")  
    suspend fun importUserData(
        @Header("Authorization") token: String,
        @Body backupData: ImportDataRequest
    ): Response<MessageResponse>
}
```

### Ví Dụ Data Classes (Thực tế Implementation):
```kotlin
// KHÔNG có ApiResponse wrapper - responses trực tiếp

// Authentication
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val refreshToken: String,
    val user: User,
    val isAdmin: Boolean
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class RefreshTokenResponse(
    val token: String,
    val refreshToken: String
)

// User Profile - Thực tế từ code
data class User(
    val id: String,
    val email: String,
    val name: String,
    val phone: String?,
    val dateOfBirth: String?,
    val gender: String?,
    val avatarUrl: String?,
    val level: Int,
    val role: String,
    val registrationMethod: String,
    val createdAt: String,
    val updatedAt: String
)

data class UserProfileResponse(
    val id: String,
    val email: String,
    val name: String,
    val phone: String?,
    val dateOfBirth: String?,
    val gender: String?,
    val avatarUrl: String?,
    val level: Int,
    val role: String,
    val registrationMethod: String,
    val createdAt: String,
    val updatedAt: String,
    val reminder: Reminder? // Bao gồm cả reminder config
)

data class UpdateProfileRequest(
    val name: String?,
    val phone: String?,
    val dateOfBirth: String?,
    val gender: String?,
    val avatarUrl: String?
)

// Message responses cho các operations
data class MessageResponse(
    val message: String
)

// Question responses - theo thực tế controller (đã có pagination)
data class QuestionListResponse(
    val questions: List<Question>, // giữ tương thích cũ
    val data: List<Question>,
    val count: Int,
    val pagination: Pagination
)

// Favorites
data class FavoriteQuestion(
    val id: String,
    val questionId: String,
    val question: String,
    val answer: String,
    val category: String,
    val createdAt: String,
    val updatedAt: String
)

data class CreateFavoriteRequest(
    val questionId: String,
    val question: String,
    val answer: String,
    val category: String
)

data class UpdateFavoriteRequest(
    val question: String,
    val answer: String,
    val category: String
)

// Exam History
data class CreateExamHistoryRequest(
    val startTime: String,
    val endTime: String,
    val totalQuestions: Int,
    val correctAnswers: Int,
    val accuracyRate: Double,
    val sections: List<ExamSectionResult>,
    val exam: ExamReference
)

data class ExamReference(
    val id: String,
    val name: String,
    val duration: Int
)

// Practice
data class StartPracticeRequest(
    val topicId: String,
    val questionCount: Int
)

data class PracticeSession(
    val id: String,
    val questions: List<Question>,
    val startTime: String
)

data class PracticeSubmission(
    val answers: List<Answer>,
    val totalScore: Int,
    val timeSpent: Int
)

data class PracticeResult(
    val id: String,
    val totalQuestions: Int,
    val correctAnswers: Int,
    val accuracyRate: Double,
    val score: Int,
    val timeSpent: Int,
    val createdAt: String
)

data class Answer(
    val questionId: String,
    val selectedAnswer: String,
    val isCorrect: Boolean
)

// User Journey
data class DayCompletion(
    val score: Int
)

data class DayResult(
    val dayNumber: Int,
    val completed: Boolean,
    val score: Int,
    val completedAt: String?
)

// User Journey
data class Journey(
    val id: String,
    val user: String,
    val stages: List<Stage>,
    val currentStageIndex: Int,
    val state: String, // "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
    val startedAt: String?,
    val completedAt: String?,
    val createdAt: String,
    val updatedAt: String
)

data class Stage(
    val stageId: String,
    val minScore: Int,
    val targetScore: Int,
    val days: List<Day>,
    val finalTest: FinalTest,
    val started: Boolean,
    val startedAt: String?,
    val state: String, // "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
    val completedAt: String?
)

data class Day(
    val dayNumber: Int,
    val started: Boolean,
    val completed: Boolean,
    val startedAt: String?,
    val completedAt: String?,
    val score: Int?,
    val questions: List<String> // Question IDs
)

data class FinalTest(
    val unlocked: Boolean,
    val started: Boolean,
    val completed: Boolean,
    val startedAt: String?,
    val completedAt: String?,
    val score: Int?,
    val passed: Boolean
)

// Question
data class Question(
    val id: String,
    val questionNumber: Int,
    val type: String, // LESSON_TYPE enum
    val question: String,
    val audio: AudioFile?,
    val imageUrl: String?,
    val answers: List<AnswerOption>?,
    val questions: List<SubQuestion>?, // For reading comprehension
    val subtitle: String?,
    val explanation: String?,
    val createdAt: String,
    val updatedAt: String
)

data class AudioFile(
    val name: String,
    val url: String
)

data class AnswerOption(
    val answer: String,
    val isCorrect: Boolean
)

data class SubQuestion(
    val question: String,
    val answers: List<AnswerOption>
)

// Exam
data class Exam(
    val id: String,
    val name: String,
    val duration: Int, // minutes
    val sections: List<ExamSection>,
    val createdAt: String,
    val updatedAt: String
)

data class ExamSection(
    val type: String, // LESSON_TYPE enum
    val questions: List<String> // Question IDs
)

data class ExamResult(
    val id: String,
    val user: String,
    val startTime: String,
    val endTime: String,
    val totalQuestions: Int,
    val correctAnswers: Int,
    val accuracyRate: Double,
    val sections: List<ExamSectionResult>,
    val exam: Exam,
    val createdAt: String,
    val updatedAt: String
)

data class ExamSectionResult(
    val type: String,
    val totalQuestions: Int,
    val correctAnswers: Int,
    val accuracyRate: Double
)

// Notification
data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val user: String,
    val isRead: Boolean,
    val createdAt: String,
    val updatedAt: String
)

// Reminder
data class Reminder(
    val id: String,
    val user: String,
    val hour: Int,
    val minute: Int,
    val createdAt: String,
    val updatedAt: String
)

// Vocabulary
data class VocabularyTopic(
    val id: String,
    val topicName: String,
    val words: List<VocabularyWord>,
    val createdAt: String,
    val updatedAt: String
)

data class VocabularyWord(
    val word: String,
    val meaning: String,
    val pronunciation: String?,
    val audio: AudioFile?
)

// Grammar
data class Grammar(
    val id: String,
    val topic: String,
    val grammars: List<GrammarRule>,
    val createdAt: String,
    val updatedAt: String
)

data class GrammarRule(
    val title: String,
    val content: String,
    val examples: List<String>
)

// Pagination
data class Pagination(
    val currentPage: Int,
    val totalPages: Int,
    val totalItems: Int,
    val itemsPerPage: Int,
    val hasNextPage: Boolean,
    val hasPrevPage: Boolean,
    val nextPage: Int?,
    val prevPage: Int?
)

// Backup & Restore - Thực tế từ code
data class ActualBackupData(
    val user: User,
    val reminders: List<Reminder>,
    val notifications: List<Notification>,
    val practiceHistories: List<PracticeResult>, // Tên field khác
    val examHistories: List<ExamResult>,
    val exportedAt: String,
    val version: Int
)

data class ImportDataRequest(
    val reminders: List<Reminder>,
    val notifications: List<Notification>,
    val practiceHistories: List<PracticeResult>,
    val examHistories: List<ExamResult>
)
```

### Ví Dụ Repository Pattern (Thực tế - Direct Response):
```kotlin
class ETrainerRepository(private val api: ETrainerAPI) {
    
    // Authentication - Direct response, NO wrapper
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                Result.success(response.body()!!) // Direct response
            } else {
                Result.failure(Exception("HTTP ${response.code()}: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun refreshToken(refreshToken: String): Result<RefreshTokenResponse> {
        return try {
            val response = api.refreshToken(RefreshTokenRequest(refreshToken))
            if (response.isSuccessful) {
                Result.success(response.body()!!) // Direct response
            } else {
                Result.failure(Exception("Token refresh failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Questions - ĐÃ hỗ trợ pagination
    suspend fun getQuestions(
        token: String,
        type: String? = null,
        page: Int? = null,
        limit: Int? = null,
        sort: String? = null,
        fields: String? = null
    ): Result<QuestionListResponse> {
        return try {
            val response = api.getQuestions(
                token = "Bearer $token",
                page = page,
                limit = limit,
                type = type,
                sort = sort,
                fields = fields
            )
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Cannot fetch questions"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Favorites - RESTful
    suspend fun getFavorites(token: String): Result<List<FavoriteQuestion>> {
        return try {
            val response = api.getFavorites("Bearer $token")
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Cannot fetch favorites"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Backup & Restore - Thực tế có
    suspend fun exportUserData(token: String): Result<ActualBackupData> {
        return try {
            val response = api.exportUserData("Bearer $token")
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Export failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
