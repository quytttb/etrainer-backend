# MongoDB URI Fixed cho Vercel Serverless

## URI gốc (có vấn đề):
mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer

## URI đã fix (khuyến nghị):
mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000&maxPoolSize=5&minPoolSize=1

## Giải thích các parameters:
- retryWrites=true: Enable retry cho write operations
- w=majority: Write concern để đảm bảo data consistency  
- serverSelectionTimeoutMS=30000: Tăng timeout cho serverless cold start
- socketTimeoutMS=45000: Socket timeout
- connectTimeoutMS=30000: Connection timeout
- maxPoolSize=5: Giảm pool size cho serverless
- minPoolSize=1: Minimum connections

## Cách cập nhật trên Vercel:
1. vercel env rm MONGODB_URI
2. vercel env add MONGODB_URI
3. Paste URI đã fix ở trên
4. Deploy lại: git push origin HEAD:master
