# Quick Start Guide - EC2 Deployment

## 📋 Before You Start

- [ ] AWS Account created
- [ ] Domain purchased from Hostinger (optional)
- [ ] All API keys ready (Google OAuth, Gemini, AWS S3)

## 🚀 Quick Deployment Steps

### 1️⃣ Launch EC2 Instance (10 minutes)

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Launch Instance**
3. Configure:
   - **Name:** `newsweb-production`
   - **OS:** Ubuntu Server 22.04 LTS
   - **Instance type:** t2.small or t2.medium
   - **Key pair:** Create new → Download `.pem` file
   - **Security Group:** Allow ports 22, 80, 443, 3000
   - **Storage:** 20 GB
4. Click **Launch**
5. **Save your EC2 Public IP!**

### 2️⃣ Connect to EC2 (2 minutes)

**Windows PowerShell:**
```powershell
# Move key file to safe location
mkdir C:\Users\harsh\.ssh
move C:\Users\harsh\Downloads\newsweb-key.pem C:\Users\harsh\.ssh\

# Set permissions
icacls "C:\Users\harsh\.ssh\newsweb-key.pem" /inheritance:r
icacls "C:\Users\harsh\.ssh\newsweb-key.pem" /grant:r "%username%:R"

# Connect (replace YOUR-EC2-IP)
ssh -i "C:\Users\harsh\.ssh\newsweb-key.pem" ubuntu@YOUR-EC2-IP
```

### 3️⃣ Setup Server (15 minutes)

**Run setup script:**
```bash
# Download setup script
curl -o deploy-setup.sh https://raw.githubusercontent.com/yourusername/newsweb/main/deploy-setup.sh

# Or manually create it (copy from deploy-setup.sh file)
nano deploy-setup.sh
# Paste content, save (Ctrl+X, Y, Enter)

# Make executable and run
chmod +x deploy-setup.sh
./deploy-setup.sh
```

**Or manual setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
sudo apt install -y git nginx
sudo npm install -g pm2

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4️⃣ Deploy Application (10 minutes)

```bash
# Clone repository
cd ~
git clone YOUR-REPO-URL
cd newsweb

# Create .env file
nano .env
```

**Paste and update:**
```env
DATABASE_URL="your-supabase-url"
DIRECT_URL="your-supabase-direct-url"
NEXTAUTH_SECRET="GENERATE_WITH: openssl rand -base64 32"
NEXTAUTH_URL="http://YOUR-EC2-IP:3000"
GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="your-email@gmail.com"
ADMIN_EMAIL="admin@newsweb.com"
ADMIN_PASSWORD="strong-password"
GEMINI_API_KEY="your-gemini-key"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="newsblog"
```

**Build and start:**
```bash
# Install and build
npm install
npx prisma generate
npx prisma migrate deploy
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

# Start with PM2
pm2 start npm --name "newsweb" -- start
pm2 save
pm2 startup
```

**Test:** Open `http://YOUR-EC2-IP:3000` in browser

### 5️⃣ Connect Domain (30 minutes - includes DNS propagation)

#### A. Get Elastic IP
1. AWS Console → EC2 → Elastic IPs
2. Allocate new Elastic IP
3. Associate with your instance
4. **Note the Elastic IP**

#### B. Configure Hostinger DNS
1. Login to [Hostinger](https://www.hostinger.com/)
2. Go to Domains → Your Domain → DNS
3. Add records:
   - Type: `A`, Name: `@`, Value: `YOUR-ELASTIC-IP`
   - Type: `A`, Name: `www`, Value: `YOUR-ELASTIC-IP`
4. Save and wait 1-2 hours

#### C. Configure Nginx
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/newsweb
```

**Paste (replace yourdomain.com):**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable and reload:**
```bash
sudo ln -s /etc/nginx/sites-available/newsweb /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Update .env:**
```bash
nano .env
# Change: NEXTAUTH_URL="http://yourdomain.com"
pm2 restart newsweb
```

### 6️⃣ Enable HTTPS (5 minutes)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Update .env
nano .env
# Change: NEXTAUTH_URL="https://yourdomain.com"
pm2 restart newsweb
```

### 7️⃣ Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Add redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
   - `https://www.yourdomain.com/api/auth/callback/google`

## ✅ Done!

Your site is live at: `https://yourdomain.com`

## 🔧 Useful Commands

```bash
# View logs
pm2 logs newsweb

# Restart app
pm2 restart newsweb

# Monitor resources
pm2 monit

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Update app
cd ~/newsweb
git pull
npm install
npm run build
pm2 restart newsweb
```

## 🆘 Common Issues

### Can't connect to EC2
- Check Security Group allows your IP on port 22
- Verify key file permissions

### Website not loading
```bash
pm2 logs newsweb  # Check app logs
sudo systemctl status nginx  # Check Nginx
```

### Build fails
```bash
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

### Google OAuth fails
- Check NEXTAUTH_URL in .env
- Verify Google Console redirect URIs
- Clear browser cookies

## 📚 Full Documentation

See [EC2_DEPLOYMENT_GUIDE.md](./EC2_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 💰 Cost Estimate

- **EC2 t2.small:** ~$17/month (730 hours)
- **EC2 t2.medium:** ~$34/month (730 hours)
- **Elastic IP:** Free (when attached to running instance)
- **Bandwidth:** First 100GB free/month

**Total:** ~$17-34/month + domain cost

## 🎯 Next Steps

- [ ] Set up automated backups
- [ ] Configure monitoring (CloudWatch)
- [ ] Set up staging environment
- [ ] Enable CloudFlare (optional)
- [ ] Configure log rotation
- [ ] Set up database backups

---

**Need Help?** Check the full guide or logs:
- Full Guide: `EC2_DEPLOYMENT_GUIDE.md`
- App Logs: `pm2 logs newsweb`
- Nginx Logs: `sudo tail -f /var/log/nginx/error.log`
