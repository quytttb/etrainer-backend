#!/bin/bash

# Force Vercel Redeploy Script
echo "🚀 Force redeploying ETrainer Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Current deployment status:"
vercel ls

echo "🔄 Triggering force redeploy..."
vercel --prod --force

echo "✅ Redeploy initiated!"
echo "🔗 Check deployment status at: https://vercel.com/dashboard"
echo "📊 Monitor logs at: https://vercel.com/dashboard/deployments"
