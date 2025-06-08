# Tính năng Bài Test Tổng Kết Giai Đoạn

## Tổng quan
Tính năng này tự động tạo bài test tổng kết cho mỗi giai đoạn từ tất cả câu hỏi trong các ngày của giai đoạn đó. Học viên phải hoàn thành tất cả các ngày trong giai đoạn và vượt qua bài test tổng kết mới được chuyển sang giai đoạn tiếp theo.

## Cấu trúc Database

### Stage Model
```javascript
{
  minScore: Number,
  targetScore: Number,
  days: [
    {
      dayNumber: Number,
      questions: [ObjectId] // ref to 'questions'
    }
  ]
  // Không cần finalTest field - tự động tạo từ tất cả questions trong days
}
```

### UserJourney Model
```javascript
{
  stages: [{
    stageId: ObjectId,
    days: [...],
    finalTest: {
      unlocked: Boolean,    // Có được phép làm test không
      started: Boolean,     // Đã bắt đầu làm test chưa
      completed: Boolean,   // Đã hoàn thành test chưa
      startedAt: Date,
      completedAt: Date,
      score: Number,        // Điểm số đạt được
      passed: Boolean       // Có pass test không (score >= minScore)
    }
  }]
}
```

## API Endpoints

### 1. Lấy thông tin bài test tổng kết
```
GET /api/journeys/stage-final-test/:stageIndex
```
**Response:**
```javascript
{
  finalTestInfo: {
    name: "Final Test - Stage 1",
    duration: 60, // phút
    totalQuestions: 30,
    questionTypes: ["IMAGE_DESCRIPTION", "ASK_AND_ANSWER"]
  },
  finalTestStatus: {}, // Trạng thái test của user
  minScore: 70,
  targetScore: 90,
  canTakeTest: true
}
```

### 2. Bắt đầu làm bài test tổng kết
```
POST /api/journeys/start-stage-final-test/:stageIndex
```
**Response:**
```javascript
{
  message: "Bắt đầu bài test tổng kết thành công",
  finalTest: {
    name: "Final Test - Stage 1",
    duration: 60,
    questions: [...], // Tất cả câu hỏi từ stage (đã shuffle)
    totalQuestions: 30
  },
  userJourney: {}
}
```

### 3. Hoàn thành bài test tổng kết
```
PUT /api/journeys/complete-stage-final-test/:stageIndex
```
**Request Body:**
```javascript
{
  startTime: "2024-01-01T10:00:00Z",
  endTime: "2024-01-01T11:00:00Z",
  questionAnswers: [
    {
      type: "IMAGE_DESCRIPTION",
      isCorrect: true,
      // ... other answer data
    }
  ]
}
```
**Response:**
```javascript
{
  message: "Chúc mừng! Bạn đã vượt qua bài test tổng kết",
  passed: true,
  score: 85.5, // accuracyRate
  correctAnswers: 25,
  totalQuestions: 30,
  minScore: 70,
  userJourney: {},
  practiceHistoryId: "..."
}
```

## Luồng hoạt động

### 1. Hoàn thành các ngày trong giai đoạn
- Khi user hoàn thành tất cả các ngày trong giai đoạn
- Hệ thống tự động unlock bài test tổng kết (`finalTest.unlocked = true`)
- Giai đoạn chỉ được đánh dấu "COMPLETED" khi:
  - Không có final test HOẶC
  - Đã pass final test

### 2. Làm bài test tổng kết
- User bắt đầu test → `finalTest.started = true`
- User hoàn thành test với điểm số
- Nếu `score >= minScore`:
  - `finalTest.passed = true`
  - Stage được đánh dấu "COMPLETED"
  - Unlock stage tiếp theo
- Nếu `score < minScore`:
  - User có thể làm lại test

### 3. Chuyển giai đoạn
- Chỉ khi pass final test, user mới được chuyển sang stage tiếp theo
- Nếu là stage cuối cùng, toàn bộ journey được đánh dấu "COMPLETED"

## Migration
Để cập nhật dữ liệu hiện có:
```bash
node src/utils/migrateFinalTest.js
```

## Cách hoạt động Final Test

### Tự động tạo từ câu hỏi Stage
1. Final test tự động lấy TẤT CẢ câu hỏi từ các ngày trong stage
2. Câu hỏi được shuffle ngẫu nhiên
3. Thời gian làm bài: 2 phút/câu, tối thiểu 30 phút
4. Điểm pass: theo `minScore` của stage

### Ví dụ Stage có Final Test:
```javascript
// Stage với 3 ngày, mỗi ngày 10 câu hỏi
{
  "minScore": 70,
  "targetScore": 90,
  "days": [
    {
      "dayNumber": 1,
      "questions": ["id1", "id2", ..., "id10"] // 10 câu
    },
    {
      "dayNumber": 2, 
      "questions": ["id11", "id12", ..., "id20"] // 10 câu
    },
    {
      "dayNumber": 3,
      "questions": ["id21", "id22", ..., "id30"] // 10 câu
    }
  ]
}
// => Final Test sẽ có 30 câu hỏi (tất cả từ 3 ngày)
```

## Tính năng sắp tới: Bài Test Tổng Kết Lộ Trình
- Test cuối cùng sau khi hoàn thành tất cả các stage
- Unlock khi user pass tất cả final test của các stage 