# ETrainer Backend

Backend server cho ứng dụng ETrainer - Ứng dụng học tiếng Anh.

## Cài đặt

```bash
npm install
```

## Chạy ở môi trường dev

```bash
npm run dev
```

## Chạy production

```bash
npm start
```

## Deploy lên Vercel

1. Kết nối repository với Vercel
2. Thiết lập environment variables
3. Deploy

## API Endpoints

Server chạy trên port 8080 (hoặc PORT từ environment variables).

API endpoints có sẵn tại `/api/*`

## Environment Variables

Cần thiết lập các biến môi trường sau:

- `PORT`: Port của server (mặc định: 8080)
- `MONGODB_URI`: Connection string cho MongoDB
- Các biến khác theo yêu cầu của ứng dụng 