#!/bin/bash

# MongoDB Atlas Setup Guide
echo "🌍 MongoDB Atlas Setup Guide"
echo "================================"

echo "📋 Step-by-step MongoDB Atlas setup:"
echo ""
echo "1️⃣  VISIT MONGODB ATLAS"
echo "   URL: https://cloud.mongodb.com"
echo "   ➤ Click 'Try Free' or 'Sign In'"
echo ""

echo "2️⃣  CREATE FREE ACCOUNT"
echo "   ➤ Sign up with Google/GitHub or email"
echo "   ➤ Choose 'Learn MongoDB' as goal"
echo "   ➤ Select 'JavaScript' as preferred language"
echo ""

echo "3️⃣  CREATE FREE CLUSTER"
echo "   ➤ Choose 'M0 FREE' tier"
echo "   ➤ Select closest region (Asia Pacific for Vietnam)"
echo "   ➤ Cluster name: 'Cluster0' (default is fine)"
echo "   ➤ Click 'Create Cluster'"
echo ""

echo "4️⃣  CREATE DATABASE USER"
echo "   ➤ Go to 'Database Access' in left sidebar"
echo "   ➤ Click 'Add New Database User'"
echo "   ➤ Username: etrainer_user"
echo "   ➤ Password: Generate secure password (save it!)"
echo "   ➤ Database User Privileges: 'Read and write to any database'"
echo "   ➤ Click 'Add User'"
echo ""

echo "5️⃣  SETUP NETWORK ACCESS"
echo "   ➤ Go to 'Network Access' in left sidebar"
echo "   ➤ Click 'Add IP Address'"
echo "   ➤ Select 'Allow Access from Anywhere' (0.0.0.0/0)"
echo "   ➤ Comment: 'Vercel Deployment Access'"
echo "   ➤ Click 'Confirm'"
echo ""

echo "6️⃣  GET CONNECTION STRING"
echo "   ➤ Go to 'Clusters' → Click 'Connect'"
echo "   ➤ Choose 'Connect your application'"
echo "   ➤ Driver: Node.js, Version: 4.1 or later"
echo "   ➤ Copy connection string"
echo "   ➤ Replace <password> with your database user password"
echo ""

echo "📝 Example connection string format:"
echo "mongodb+srv://etrainer_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/etrainer?retryWrites=true&w=majority"
echo ""

read -p "🤔 Have you completed steps 1-6? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Great! Now let's test the connection..."
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy your MongoDB connection string"
    echo "2. Update MONGODB_ATLAS_URI in Vercel dashboard"
    echo "3. Run the test script to verify connection"
    
    read -p "🔗 Enter your MongoDB Atlas connection string: " MONGO_URI
    
    if [ ! -z "$MONGO_URI" ]; then
        echo "✅ Connection string received!"
        echo "📝 Your connection string (keep this secure):"
        echo "$MONGO_URI"
        echo ""
        echo "🔧 Now go to Vercel dashboard and update MONGODB_ATLAS_URI:"
        echo "https://vercel.com/angelo-buis-projects/etrainer-backend/settings/environment-variables"
    else
        echo "⚠️  No connection string provided. Please run this script again when ready."
    fi
else
    echo "📋 Please complete the MongoDB Atlas setup first, then run this script again."
    echo "💡 Tip: The free tier gives you 512MB storage - perfect for testing!"
fi

echo ""
echo "🎯 Once MongoDB is setup, proceed to test API endpoints!"
