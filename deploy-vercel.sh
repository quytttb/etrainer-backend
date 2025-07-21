#!/bin/bash

# ETrainer Backend - Vercel Deployment Script
echo "🚀 Deploying ETrainer Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if .env.vercel exists
if [ ! -f .env.vercel ]; then
    echo "❌ .env.vercel not found. Please create it with your environment variables."
    echo "📝 Template created at .env.vercel"
    echo "⚠️  Please edit .env.vercel with your MongoDB Atlas URI and other credentials"
    exit 1
fi

echo "🔧 Environment variables to set in Vercel dashboard:"
echo "================================"
cat .env.vercel | grep -v '^#' | grep -v '^$'
echo "================================"

echo ""
echo "📋 Next steps:"
echo "1. Run 'vercel login' if you haven't already"
echo "2. Run 'vercel' to deploy"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Run 'vercel --prod' for production deployment"

read -p "🤔 Do you want to deploy now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting deployment..."
    
    # Login check
    echo "👤 Checking Vercel authentication..."
    if ! vercel whoami > /dev/null 2>&1; then
        echo "🔐 Please login to Vercel:"
        vercel login
    fi
    
    # Deploy
    echo "📦 Deploying to Vercel..."
    vercel --prod
    
    echo ""
    echo "✅ Deployment completed!"
    echo "⚠️  Don't forget to set environment variables in Vercel dashboard:"
    echo "   https://vercel.com/dashboard"
else
    echo "👋 Deployment cancelled. Run this script again when ready!"
fi
