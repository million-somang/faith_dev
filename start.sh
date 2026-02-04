#!/bin/bash

# Auto-migrate database
echo "🔄 Applying database migrations..."
npm run db:migrate:local

# Build the project
echo "🏗️  Building project..."
npm run build

# Start PM2
echo "🚀 Starting service with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs

echo "✅ Service started!"
echo "📊 Check status: pm2 status"
echo "📝 Check logs: pm2 logs --nostream"
