#!/bin/bash

# =============================================================================
# EC2 Server Setup Script for Ubuntu 22.04
# This script sets up the server environment for Next.js application
# =============================================================================

set -e  # Exit on any error

echo "================================================"
echo "  EC2 Server Setup for Next.js Application"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root or with sudo"
    exit 1
fi

echo "Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y
print_success "System packages updated"
echo ""

echo "Step 2: Installing Node.js 20.x..."
if command -v node &> /dev/null; then
    print_info "Node.js is already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed: $(node -v)"
fi
echo ""

echo "Step 3: Installing Git..."
if command -v git &> /dev/null; then
    print_info "Git is already installed: $(git --version)"
else
    sudo apt install git -y
    print_success "Git installed"
fi
echo ""

echo "Step 4: Installing PM2 (Process Manager)..."
if command -v pm2 &> /dev/null; then
    print_info "PM2 is already installed: $(pm2 -v)"
else
    sudo npm install -g pm2
    print_success "PM2 installed"
fi
echo ""

echo "Step 5: Installing Nginx..."
if command -v nginx &> /dev/null; then
    print_info "Nginx is already installed"
else
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
fi
echo ""

echo "Step 6: Configuring firewall (UFW)..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js (temporary)
print_success "Firewall configured"
echo ""

echo "Step 7: Installing additional dependencies..."
sudo apt install -y build-essential
sudo apt install -y certbot python3-certbot-nginx
print_success "Additional dependencies installed"
echo ""

echo "================================================"
print_success "Server setup completed successfully!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Create .env file with your environment variables"
echo "3. Run: npm install"
echo "4. Run: npm run build"
echo "5. Run: pm2 start npm --name newsweb -- start"
echo ""
print_info "To test Nginx, open http://$(curl -s ifconfig.me) in your browser"
echo ""
