#!/bin/bash

# =============================================================================
# Nginx Configuration Script
# This script configures Nginx as reverse proxy for Next.js
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_prompt() {
    echo -e "${BLUE}? $1${NC}"
}

echo "================================================"
echo "  Nginx Configuration for Next.js"
echo "================================================"
echo ""

# Ask for domain name
print_prompt "Enter your domain name (e.g., example.com):"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    print_error "Domain name is required!"
    exit 1
fi

print_info "Configuring Nginx for domain: $DOMAIN"
echo ""

# Create Nginx configuration
NGINX_CONFIG="/etc/nginx/sites-available/newsweb"

echo "Creating Nginx configuration..."
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Logging
    access_log /var/log/nginx/newsweb_access.log;
    error_log /var/log/nginx/newsweb_error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching (if you have /public folder)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

print_success "Nginx configuration created"
echo ""

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/newsweb

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    print_info "Removed default Nginx site"
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi
echo ""

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx
print_success "Nginx reloaded"
echo ""

echo "================================================"
print_success "Nginx configured successfully!"
echo "================================================"
echo ""
print_info "Next steps:"
echo "1. Update your .env file: NEXTAUTH_URL=\"http://$DOMAIN\""
echo "2. Restart your app: pm2 restart newsweb"
echo "3. Update Google OAuth redirect URI to: http://$DOMAIN/api/auth/callback/google"
echo ""
print_info "To enable HTTPS (SSL), run:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
print_info "Then update .env to: NEXTAUTH_URL=\"https://$DOMAIN\""
echo ""
