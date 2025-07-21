# 🚀 DEPLOYMENT GUIDE

## 1. 🌐 VERCEL DEPLOYMENT (Recommended)

### Setup:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Environment Variables (Vercel Dashboard):
```
NODE_ENV=production
ENABLE_CLUSTERING=false
JWT_SECRET=your_secure_jwt_secret
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/etrainer
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REDIS_URL=redis://your-redis-provider.com:6379
```

### Vercel Limitations:
- ❌ No clustering (serverless functions)
- ✅ Free tier: 100GB bandwidth
- ✅ Global CDN
- ✅ Automatic HTTPS

---

## 2. 🔥 HEROKU DEPLOYMENT

### Setup:
```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create etrainer-backend

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git push heroku main
```

### Procfile for Heroku:
```
web: node server.js
worker: node src/configs/jobScheduler.js
```

### Environment Variables (Heroku Dashboard or CLI):
```bash
heroku config:set NODE_ENV=production
heroku config:set ENABLE_CLUSTERING=false
heroku config:set JWT_SECRET=your_secure_jwt_secret
heroku config:set MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/etrainer
```

### Heroku Limitations:
- ❌ No clustering on free tier
- ❌ Sleep after 30 minutes inactivity
- ✅ Free tier: 550 hours/month
- ✅ Add-ons available (Redis, MongoDB)

---

## 3. 🐳 DOCKER CLOUD DEPLOYMENT

### Railway.app (Recommended for Docker):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway deploy
```

### Render.com:
- Connect GitHub repository
- Select Docker deployment
- Set environment variables
- Deploy automatically

### DigitalOcean App Platform:
- Connect GitHub repository
- Configure as Docker container
- Set scaling options

---

## 4. 🌍 MONGODB ATLAS SETUP

### Free Tier (512MB):
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for cloud deployment)
5. Get connection string

---

## 5. ☁️ CLOUDINARY SETUP

### Free Tier (25GB storage, 25GB bandwidth):
1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for free account
3. Get API credentials from dashboard
4. Configure environment variables

---

## 6. 🔴 REDIS CLOUD SETUP

### Free Tier (30MB):
1. Go to [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. Create free database
3. Get connection URL
4. Set REDIS_URL environment variable

---

## 🎯 RECOMMENDED STACK FOR FREE DEPLOYMENT:

### Option A: Serverless (No hardware needed)
- **Platform**: Vercel
- **Database**: MongoDB Atlas (Free 512MB)
- **Cache**: Redis Cloud (Free 30MB)
- **Media**: Cloudinary (Free 25GB)
- **Cost**: $0/month

### Option B: Container (Minimal hardware)
- **Platform**: Railway.app
- **Database**: MongoDB Atlas
- **Cache**: Built-in Redis
- **Media**: Cloudinary
- **Cost**: $5-10/month for better performance

---

## 📋 DEPLOYMENT CHECKLIST:

### Before Deploy:
- [ ] Update environment variables
- [ ] Test health endpoint
- [ ] Verify database connection
- [ ] Check all dependencies installed
- [ ] Disable clustering for serverless

### After Deploy:
- [ ] Test API endpoints
- [ ] Verify CORS settings
- [ ] Check logs for errors
- [ ] Monitor performance
- [ ] Set up custom domain (optional)

---

## 🔧 PRODUCTION OPTIMIZATIONS:

### For Vercel/Serverless:
```javascript
// Disable clustering
process.env.ENABLE_CLUSTERING = 'false';

// Optimize cold starts
const keepWarm = setInterval(() => {
  // Keep function warm
}, 14 * 60 * 1000); // 14 minutes
```

### For Container Platforms:
```javascript
// Enable clustering
process.env.ENABLE_CLUSTERING = 'true';
process.env.WORKER_COUNT = '2'; // Adjust based on resources
```

---

**Recommendation**: Start with **Vercel** for free, then upgrade to **Railway** or **Render** if you need more control!
