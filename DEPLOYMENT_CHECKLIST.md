# 🚀 EC2 Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## Pre-Deployment Checklist

### AWS Account Setup
- [ ] AWS account created and verified
- [ ] Payment method added to AWS
- [ ] Understand EC2 pricing (~$17-34/month)
- [ ] Have access to AWS Console

### Domain Setup (Optional)
- [ ] Domain purchased from Hostinger
- [ ] Have access to Hostinger DNS settings
- [ ] Domain is active and not expired

### API Keys & Credentials Ready
- [ ] Supabase Database URL (already configured)
- [ ] Google OAuth Client ID & Secret
- [ ] Gmail App Password for SMTP
- [ ] Gemini API Key
- [ ] AWS S3 Access Keys
- [ ] Strong admin password chosen

---

## Phase 1: EC2 Instance Setup (10-15 minutes)

### Launch Instance
- [ ] Logged into AWS Console
- [ ] Navigated to EC2 Dashboard
- [ ] Clicked "Launch Instance"
- [ ] Named instance: `newsweb-production`
- [ ] Selected Ubuntu Server 22.04 LTS
- [ ] Chose instance type: t2.small or t2.medium
- [ ] Created and downloaded key pair (.pem file)
- [ ] Saved key pair in safe location
- [ ] Configured Security Group:
  - [ ] Port 22 (SSH) - My IP
  - [ ] Port 80 (HTTP) - 0.0.0.0/0
  - [ ] Port 443 (HTTPS) - 0.0.0.0/0
  - [ ] Port 3000 (Custom) - 0.0.0.0/0
- [ ] Set storage to 20 GB
- [ ] Launched instance
- [ ] Instance is in "running" state
- [ ] **Copied Public IPv4 address:** `_________________`

### Elastic IP (Important!)
- [ ] Navigated to EC2 → Elastic IPs
- [ ] Clicked "Allocate Elastic IP address"
- [ ] Associated Elastic IP with instance
- [ ] **Copied Elastic IP:** `_________________`

---

## Phase 2: Connect to EC2 (5 minutes)

### Windows (PowerShell)
- [ ] Moved .pem file to `C:\Users\harsh\.ssh\`
- [ ] Set correct permissions on .pem file
- [ ] Successfully connected via SSH
- [ ] Verified connection with `ls` command

### Connection Command Used
```bash
ssh -i "PATH_TO_PEM_FILE" ubuntu@ELASTIC_IP
```

---

## Phase 3: Server Environment Setup (15-20 minutes)

### System Updates
- [ ] Ran `sudo apt update`
- [ ] Ran `sudo apt upgrade -y`

### Node.js Installation
- [ ] Downloaded Node.js 20.x setup script
- [ ] Installed Node.js
- [ ] Verified: `node -v` shows v20.x.x
- [ ] Verified: `npm -v` shows 10.x.x

### Essential Tools
- [ ] Installed Git: `sudo apt install git -y`
- [ ] Installed PM2: `sudo npm install -g pm2`
- [ ] Installed Nginx: `sudo apt install nginx -y`
- [ ] Started Nginx: `sudo systemctl start nginx`
- [ ] Enabled Nginx: `sudo systemctl enable nginx`
- [ ] Verified Nginx running on `http://ELASTIC_IP`

### SSL Tool (Certbot)
- [ ] Installed Certbot: `sudo apt install certbot python3-certbot-nginx -y`

---

## Phase 4: Application Deployment (15-20 minutes)

### Repository Setup
- [ ] Configured Git (if needed)
- [ ] Cloned repository to `~/newsweb`
- [ ] Changed to project directory: `cd ~/newsweb`
- [ ] Verified files with `ls -la`

### Environment Configuration
- [ ] Created `.env` file: `nano .env`
- [ ] Added all environment variables
- [ ] **Updated NEXTAUTH_URL with EC2 IP/domain**
- [ ] **Generated new NEXTAUTH_SECRET:** `openssl rand -base64 32`
- [ ] **Changed default admin password**
- [ ] Saved .env file
- [ ] Verified .env exists: `cat .env`

### Build & Deploy
- [ ] Ran `npm install` (takes 3-5 minutes)
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma migrate deploy`
- [ ] Set Node memory: `export NODE_OPTIONS="--max-old-space-size=2048"`
- [ ] Ran `npm run build` (takes 2-5 minutes)
- [ ] Build completed successfully (no errors)

### PM2 Process Management
- [ ] Started app: `pm2 start npm --name "newsweb" -- start`
- [ ] Checked status: `pm2 status` (shows "online")
- [ ] Configured startup: `pm2 startup` → ran generated command
- [ ] Saved PM2 list: `pm2 save`
- [ ] Tested app at: `http://ELASTIC_IP:3000`
- [ ] **App loads successfully in browser** ✓

---

## Phase 5: Domain Configuration (30-120 minutes)

### Hostinger DNS Setup
- [ ] Logged into Hostinger account
- [ ] Navigated to Domains section
- [ ] Selected domain to configure
- [ ] Went to DNS/Nameservers settings
- [ ] Added A record: `@` → `ELASTIC_IP`
- [ ] Added A record: `www` → `ELASTIC_IP`
- [ ] Saved DNS changes
- [ ] **DNS propagation in progress** (1-2 hours)
- [ ] Verified DNS: `nslookup yourdomain.com`
- [ ] **Domain resolves to correct IP** ✓

### Nginx Configuration for Domain
- [ ] Created Nginx config: `/etc/nginx/sites-available/newsweb`
- [ ] Updated `server_name` with actual domain
- [ ] Created symbolic link to sites-enabled
- [ ] Removed default site
- [ ] Tested config: `sudo nginx -t`
- [ ] Reloaded Nginx: `sudo systemctl reload nginx`
- [ ] **Domain loads website** ✓

### Update Environment for Domain
- [ ] Updated `.env`: `NEXTAUTH_URL="http://yourdomain.com"`
- [ ] Restarted app: `pm2 restart newsweb`
- [ ] Tested: `http://yourdomain.com` loads correctly

---

## Phase 6: SSL Certificate (10 minutes)

### Certbot SSL
- [ ] Ran: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
- [ ] Entered email address
- [ ] Agreed to terms
- [ ] Chose to redirect HTTP to HTTPS
- [ ] Certificate obtained successfully
- [ ] Updated `.env`: `NEXTAUTH_URL="https://yourdomain.com"`
- [ ] Restarted app: `pm2 restart newsweb`
- [ ] **Site loads with HTTPS** ✓ (green padlock)
- [ ] Verified auto-renewal: `sudo certbot renew --dry-run`

---

## Phase 7: OAuth Configuration

### Google OAuth Console
- [ ] Opened [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigated to APIs & Services → Credentials
- [ ] Selected OAuth 2.0 Client ID
- [ ] Added Authorized Redirect URIs:
  - [ ] `https://yourdomain.com/api/auth/callback/google`
  - [ ] `https://www.yourdomain.com/api/auth/callback/google`
- [ ] Saved changes
- [ ] **Tested Google Sign-In** ✓

---

## Phase 8: Testing & Verification (15 minutes)

### Functionality Tests
- [ ] Homepage loads correctly
- [ ] Google OAuth login works
- [ ] Email OTP login works
- [ ] Admin panel accessible
- [ ] Article creation works
- [ ] Image upload works (S3)
- [ ] Comments work
- [ ] Newsletter subscription works
- [ ] RSS feed works
- [ ] All pages load without errors

### Performance & Monitoring
- [ ] Checked PM2 status: `pm2 status`
- [ ] Checked logs: `pm2 logs newsweb`
- [ ] No errors in logs
- [ ] Checked Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Memory usage acceptable: `free -h`
- [ ] Disk space sufficient: `df -h`

---

## Phase 9: Security Hardening (Optional but Recommended)

### Security Best Practices
- [ ] Changed default admin password
- [ ] Verified .env is not in git repository
- [ ] Enabled UFW firewall (optional)
- [ ] Configured SSH key-only authentication (optional)
- [ ] Set up CloudWatch monitoring (optional)
- [ ] Configured automated backups (optional)

---

## Phase 10: Documentation & Handoff

### Documentation
- [ ] Saved all credentials in password manager
- [ ] Documented server IP: `_________________`
- [ ] Documented Elastic IP: `_________________`
- [ ] Documented domain: `_________________`
- [ ] Saved SSH key path: `_________________`
- [ ] Noted AWS instance ID: `_________________`

### Useful Commands Documented
```bash
# Connect to EC2
ssh -i "~/.ssh/newsweb-key.pem" ubuntu@ELASTIC_IP

# Check app status
pm2 status
pm2 logs newsweb

# Restart app
pm2 restart newsweb

# Update app
cd ~/newsweb
git pull
npm install
npm run build
pm2 restart newsweb

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# View logs
pm2 logs newsweb
sudo tail -f /var/log/nginx/error.log

# SSL renewal (automatic)
sudo certbot renew --dry-run
```

---

## 🎉 DEPLOYMENT COMPLETE!

### Final Verification
- [ ] **Production URL:** `https://yourdomain.com` ✓
- [ ] Site is live and accessible
- [ ] All features working
- [ ] SSL certificate valid
- [ ] PM2 keeping app running
- [ ] No errors in logs

### Monthly Costs
- EC2 Instance: ~$17-34/month
- Elastic IP: Free (while attached)
- Domain: As per Hostinger plan
- **Total:** ~$17-34/month + domain

---

## 📞 Support & Resources

### Official Documentation
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Troubleshooting
- See `EC2_DEPLOYMENT_GUIDE.md` → Troubleshooting section
- Check logs: `pm2 logs newsweb`
- Check Nginx: `sudo tail -f /var/log/nginx/error.log`

### Emergency Commands
```bash
# Restart everything
pm2 restart newsweb
sudo systemctl restart nginx

# Stop app
pm2 stop newsweb

# Check what's using port 3000
sudo lsof -i :3000

# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)
```

---

## 🔄 Regular Maintenance

### Weekly
- [ ] Check PM2 status: `pm2 status`
- [ ] Check disk space: `df -h`
- [ ] Review error logs

### Monthly
- [ ] Update system: `sudo apt update && sudo apt upgrade`
- [ ] Check SSL expiry: `sudo certbot certificates`
- [ ] Review AWS billing
- [ ] Database backup verification

### As Needed
- [ ] Deploy updates: `git pull && npm install && npm run build && pm2 restart newsweb`
- [ ] Scale instance if needed
- [ ] Review security groups

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Notes:** _______________________________________________
