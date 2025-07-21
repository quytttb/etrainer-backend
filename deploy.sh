#!/bin/bash

# ETrainer Backend Deployment Script

echo "🚀 ETrainer Backend Deployment"
echo "================================"

# Function to deploy to Vercel
deploy_vercel() {
    echo "📦 Deploying to Vercel..."
    
    # Check if vercel is installed
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to production
    echo "🔄 Starting deployment..."
    vercel --prod
    
    echo "✅ Vercel deployment completed!"
    echo "🌐 Check your deployment at: https://vercel.com/dashboard"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "📦 Deploying to Heroku..."
    
    # Check if heroku is installed
    if ! command -v heroku &> /dev/null; then
        echo "❌ Heroku CLI not found. Please install from:"
        echo "   https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if heroku app exists
    APP_NAME="etrainer-backend-$(date +%s)"
    echo "🔄 Creating Heroku app: $APP_NAME"
    
    heroku create $APP_NAME
    heroku buildpacks:set heroku/nodejs -a $APP_NAME
    
    # Set basic environment variables
    echo "🔧 Setting environment variables..."
    heroku config:set NODE_ENV=production -a $APP_NAME
    heroku config:set ENABLE_CLUSTERING=false -a $APP_NAME
    
    # Deploy
    echo "🔄 Starting deployment..."
    git push heroku main
    
    echo "✅ Heroku deployment completed!"
    echo "🌐 Your app is available at: https://$APP_NAME.herokuapp.com"
}

# Function to setup environment
setup_env() {
    echo "🔧 Setting up environment..."
    
    if [ ! -f .env ]; then
        echo "📝 Creating .env from template..."
        cp .env.production.example .env
        echo "⚠️  Please edit .env file with your actual credentials"
        echo "   Required: MONGODB_ATLAS_URI, JWT_SECRET, CLOUDINARY_* variables"
    fi
    
    echo "📦 Installing dependencies..."
    npm ci --production
    
    echo "🧪 Running health check..."
    npm run start &
    SERVER_PID=$!
    
    sleep 5
    
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
    fi
    
    kill $SERVER_PID 2>/dev/null
}

# Function to show deployment options
show_options() {
    echo "Select deployment option:"
    echo "1) Vercel (Recommended - Free)"
    echo "2) Heroku (Free with limitations)"
    echo "3) Setup environment only"
    echo "4) Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            setup_env
            deploy_vercel
            ;;
        2)
            setup_env
            deploy_heroku
            ;;
        3)
            setup_env
            ;;
        4)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            show_options
            ;;
    esac
}

# Main execution
echo "🔍 Checking current directory..."
if [ ! -f package.json ]; then
    echo "❌ package.json not found. Please run this script in the project root."
    exit 1
fi

echo "✅ Project detected: $(grep '"name"' package.json | cut -d'"' -f4)"
echo ""

show_options
