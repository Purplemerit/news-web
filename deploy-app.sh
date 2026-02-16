#!/bin/bash

# =============================================================================
# Application Deployment Script
# This script deploys/updates the Next.js application
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

echo "================================================"
echo "  Deploying Next.js Application"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo "Please create .env file before deploying."
    echo "You can copy .env.example: cp .env.example .env"
    exit 1
fi

print_success ".env file found"
echo ""

echo "Step 1: Installing dependencies..."
npm install
print_success "Dependencies installed"
echo ""

echo "Step 2: Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"
echo ""

echo "Step 3: Running database migrations..."
npx prisma migrate deploy
print_success "Database migrations completed"
echo ""

echo "Step 4: Building Next.js application..."
# Increase Node.js memory for build
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
print_success "Application built successfully"
echo ""

echo "Step 5: Managing PM2 process..."
if pm2 list | grep -q "newsweb"; then
    print_info "Restarting existing PM2 process..."
    pm2 restart newsweb
else
    print_info "Starting new PM2 process..."
    pm2 start npm --name "newsweb" -- start
    pm2 save
fi
print_success "Application is running with PM2"
echo ""

echo "Step 6: Setting up PM2 startup..."
pm2 startup | grep -v "PM2" | grep "sudo" | bash || true
pm2 save
print_success "PM2 startup configured"
echo ""

echo "================================================"
print_success "Deployment completed successfully!"
echo "================================================"
echo ""
echo "Application status:"
pm2 list
echo ""
echo "To view logs: pm2 logs newsweb"
echo "To monitor: pm2 monit"
echo ""
