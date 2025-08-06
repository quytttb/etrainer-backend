# Tài Liệu API ETrainer Backend Cho Phát Triển Android

URL Gốc: `https://etrainer-backend.vercel.app/api`

## 🔐 Yêu Cầu Xác Thực
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
  "username": "string",
  "email": "string", 
  "password": "string",
  "fullName": "string"
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

---

## 👤 2. Routes Người Dùng (`/api/users`)

### GET `/api/users/profile` 🔒
Lấy thông tin cá nhân người dùng hiện tại

### PUT `/api/users/profile` 🔒
Cập nhật thông tin cá nhân
```json
{
  "fullName": "string",
  "email": "string"
}
```

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

### DELETE `/api/users/delete-account` 🔒
Xóa tài khoản người dùng

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

### GET `/api/question`
Lấy tất cả câu hỏi (phân trang, có cache)

### GET `/api/question/:id`
Lấy câu hỏi theo ID

---

## 📊 7. Routes Bài Thi (`/api/exam`) 🔒

### GET `/api/exam`
Lấy tất cả bài thi

### GET `/api/exam/:id`
Lấy bài thi theo ID

### POST `/api/exam/submit`
Nộp bài thi
```json
{
  "examId": "string",
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

### GET `/api/exam/result/:id`
Lấy kết quả bài thi theo ID

---

## 🎯 8. Routes Luyện Tập (`/api/practice`) 🔒

### POST `/api/practice/start`
Bắt đầu phiên luyện tập
```json
{
  "topicId": "string",
  "questionCount": number
}
```

### POST `/api/practice/submit`
Nộp bài luyện tập
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

### GET `/api/practice/history`
Lấy lịch sử luyện tập

### GET `/api/practice/history/:id`
Lấy phiên luyện tập theo ID

---

## 🗺️ 9. Routes Hành Trình Học Tập (`/api/journeys`) 🔒

### POST `/api/journeys`
Tạo hành trình mới

### GET `/api/journeys/current`
Lấy hành trình hiện tại của người dùng

### PUT `/api/journeys/complete-day/:stageIndex/:dayNumber`
Hoàn thành một ngày trong hành trình

### PUT `/api/journeys/start-next-day/:stageIndex/:dayNumber`
Bắt đầu ngày tiếp theo trong hành trình

### GET `/api/journeys/final-test/:stageIndex`
Lấy bài kiểm tra cuối giai đoạn

### POST `/api/journeys/start-stage-final-test/:stageIndex`
Bắt đầu bài kiểm tra cuối giai đoạn

### PUT `/api/journeys/submit-final-test/:stageIndex`
Nộp bài kiểm tra cuối giai đoạn

### POST `/api/journeys/skip-stage/:stageIndex`
Bỏ qua giai đoạn hiện tại

### GET `/api/journeys/all`
Lấy tất cả hành trình của người dùng

---

## ⭐ 10. Routes Yêu Thích (`/api/favorites`)

### GET `/api/favorites?userId=<userId>`
Lấy các câu hỏi yêu thích của người dùng

### POST `/api/favorites/add`
Thêm câu hỏi vào danh sách yêu thích
```json
{
  "userId": "string",
  "questionId": "string"
}
```

### DELETE `/api/favorites/:id`
Xóa khỏi danh sách yêu thích

---

## 📈 11. Routes Thống Kê (`/api/stats`)

### GET `/api/stats/user-stats?userId=<userId>`
Lấy thống kê của người dùng

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

### Ví Dụ API Call Android:
```kotlin
interface ETrainerAPI {
    @POST("auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<LoginResponse>
    
    @GET("journeys/current")
    suspend fun getCurrentJourney(@Header("Authorization") token: String): Response<Journey>
    
    @POST("practice/submit")
    suspend fun submitPractice(
        @Header("Authorization") token: String,
        @Body submission: PracticeSubmission
    ): Response<PracticeResult>
}
```

### Ví Dụ Data Classes:
```kotlin
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: User
)

data class User(
    val id: String,
    val email: String,
    val fullName: String
)

data class PracticeSubmission(
    val answers: List<Answer>,
    val totalScore: Int,
    val timeSpent: Int
)

data class Answer(
    val questionId: String,
    val selectedAnswer: String,
    val isCorrect: Boolean
)
```

### Ví Dụ Repository Pattern:
```kotlin
class ETrainerRepository(private val api: ETrainerAPI) {
    
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Đăng nhập thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCurrentJourney(token: String): Result<Journey> {
        return try {
            val response = api.getCurrentJourney("Bearer $token")
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Không thể lấy hành trình"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
