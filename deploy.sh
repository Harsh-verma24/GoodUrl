#!/bin/bash

set -e

echo "🚀 Starting deployment..."

echo "📥 Pulling latest code..."
git pull

echo "📦 Installing dependencies..."


cd vercel-upload-service
npm install
npm run build
cd ..

cd vercel-deploy-service
npm install
npm run build
cd ..

cd vercel-request-service
npm install
npm run build
cd ..


echo "🌐 Building frontend..."
cd frontend
npm install
npm run build
cd ..


echo "♻️ Restarting PM2 services..."

pm2 restart ecosystem.config.js --update-env

pm2 save

echo "✅ Deployment completed!"