# 🚀 Comment Winner - Deployment Readiness Checklist

## Pre-Deployment (Do Once)

### Facebook Developer Setup
- [ ] Create Facebook Developer account at developers.facebook.com
- [ ] Create new Facebook App
- [ ] Add Facebook Login product
- [ ] Get your **App ID**
- [ ] Get your **App Secret** (keep private!)
- [ ] Add OAuth Redirect URIs:
  - `http://localhost:3000/` (local dev)
  - `https://comment-winner.onrender.com/` (Render)
  - `https://yourdomain.com/` (Contabo)
- [ ] Enable required permissions:
  - `pages_read_engagement`
  - `instagram_basic`
  - `instagram_manage_insights`

### Code Updates
- [ ] Have your App ID ready (entered in the app's Settings panel, not in code)
- [ ] Verify `server.js` has correct Meta API version
- [ ] Review `.env.example` for all required variables
- [ ] Create `.env` file with your credentials

## Local Development (Test First)

### Environment Setup
```bash
# Install Node.js (v16+)
node --version  # Should be v16+

# Clone the repository
cd /home/user/comment-winner

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Meta Access Token
```

### Configuration
- [ ] Add Meta Access Token to `.env`
- [ ] Verify App ID is entered correctly in the app's Settings panel
- [ ] Test locally before deploying

### Testing
```bash
# Start development server
npm run dev

# Open http://localhost:3000
# Test the following:
```

- [ ] Page loads without errors
- [ ] Settings modal opens
- [ ] Facebook OAuth button appears
- [ ] Can click and see login dialog
- [ ] After login, token is captured
- [ ] Can input test Facebook post URL
- [ ] Can fetch and see comments
- [ ] Can apply filters
- [ ] Can draw winners
- [ ] Can export CSV
- [ ] Can export XLSX
- [ ] Mobile view is responsive
- [ ] Dark mode looks correct
- [ ] Arabic text displays properly

### Browser Console
- [ ] No JavaScript errors
- [ ] No 403/404 errors
- [ ] Facebook SDK loaded successfully
- [ ] `window.FB` is available after 1 second

## Render Deployment (Cloud Free Tier)

### Prerequisites
- [ ] GitHub account connected
- [ ] Repository pushed to GitHub
- [ ] Render account created
- [ ] Node.js environment selected

### Deployment Steps
1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: comment-winner
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run winner`
   - **Plan**: Free (if available)

### Environment Variables
Add to Render dashboard:
- `NODE_ENV=production`
- `META_ACCESS_TOKEN=your_token_here`
- `RENDER_EXTERNAL_URL=https://comment-winner.onrender.com`

### Post-Deployment Testing
- [ ] Service deployed successfully
- [ ] Open https://comment-winner.onrender.com
- [ ] Test OAuth flow
- [ ] Test comment fetching (will use mock data due to network restrictions)
- [ ] Test export functionality
- [ ] Monitor logs for errors

### Known Limitations
⚠️ Render free tier has network restrictions:
- Cannot access external APIs (including Meta Graph API)
- Will use mock data instead
- Good for UI/UX testing only
- **Solution**: Use Contabo for production with real data

## Contabo VPS Deployment (Recommended for Production)

### Prerequisites
- [ ] Contabo account created
- [ ] VPS running with Ubuntu/Debian
- [ ] SSH access configured
- [ ] Domain/subdomain set up
- [ ] DNS pointing to VPS IP

### Server Preparation
```bash
# SSH into your Contabo VPS
ssh user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (latest LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install -y nginx

# Verify installations
node --version
npm --version
pm2 --version
```

### Application Deployment
```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/ohaigoune-debug/comment-winner.git
cd comment-winner

# Install dependencies
npm install

# Create .env file
nano .env
# Add your configuration

# Start with PM2
pm2 start server.js --name comment-winner
pm2 save
pm2 startup
```

### Nginx Configuration
Create `/etc/nginx/sites-available/comment-winner`:

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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/comment-winner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### HTTPS Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Update Facebook App
- [ ] Add HTTPS redirect URI: `https://yourdomain.com/`
- [ ] Update `.env` with production token
- [ ] Restart PM2: `pm2 restart all`

### Monitoring & Maintenance
```bash
# View logs
pm2 logs comment-winner

# Monitor process
pm2 monit

# Restart on reboot
pm2 startup
pm2 save

# Update application
cd ~/apps/comment-winner
git pull
npm install
pm2 restart comment-winner
```

## Post-Deployment Verification

### Functional Testing
- [ ] Homepage loads
- [ ] Settings modal works
- [ ] Facebook OAuth completes
- [ ] Post URL detection works
- [ ] Comments fetch correctly
- [ ] Filters apply properly
- [ ] Winners draw correctly
- [ ] Export generates files
- [ ] Mobile version responsive

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API responses < 5 seconds
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth animations

### Security Testing
- [ ] HTTPS works (Contabo only)
- [ ] Token not exposed in URLs
- [ ] CORS headers correct
- [ ] No XSS vulnerabilities
- [ ] localStorage working

### Browser Compatibility
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check service availability
- [ ] Verify database integrity

### Weekly
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Verify backups working

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review security patches
- [ ] Database optimization
- [ ] Performance analysis

### Quarterly
- [ ] Full security audit
- [ ] Load testing
- [ ] Disaster recovery test
- [ ] Feature review

## Troubleshooting Guide

### Common Issues

#### "Facebook SDK not loaded"
```
Solution: Check internet connection, clear cache, wait 2 seconds
```

#### "403 Forbidden from Meta API"
```
Solution: This is expected on Render (network restricted)
         Deploy to Contabo for real API access
```

#### "Token not saving"
```
Solution: Check localStorage is enabled
         Check browser console for errors
         Try incognito mode
```

#### "Comments not fetching"
```
Solution: Verify access token is correct
         Check OAuth permissions in Facebook App
         Verify post URL is public
         Check API rate limits
```

#### "Nginx 502 Bad Gateway"
```
Solution: Check if Node.js is running: pm2 status
         Restart Node.js: pm2 restart all
         Check error logs: pm2 logs
```

## Rollback Plan

If deployment has critical issues:

### Quick Rollback
```bash
# Stop current version
pm2 stop comment-winner

# Checkout previous commit
cd ~/apps/comment-winner
git revert HEAD
npm install
pm2 start comment-winner

# Monitor
pm2 logs comment-winner
```

### Database Recovery
```bash
# Backup current database
cp database.db database.db.backup

# Restore from backup
cp database.db.backup database.db

# Restart
pm2 restart comment-winner
```

## Sign-Off Checklist

- [ ] All tests passing locally
- [ ] Code reviewed and committed
- [ ] Documentation complete
- [ ] Environment variables configured
- [ ] Facebook App ID updated
- [ ] OAuth flow tested
- [ ] Export functionality verified
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Ready for production

## Deployment Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Setup | 30 min | ⏳ |
| Local Testing | 1 hour | ⏳ |
| Render Deploy | 10 min | ✅ |
| Contabo Deploy | 1 hour | ⏳ |
| Final Testing | 30 min | ⏳ |
| Go Live | Immediate | ⏳ |

**Total Time**: ~3.5 hours for full production setup

---

## Next Steps

1. **Today**: Complete Facebook App configuration
2. **Tomorrow**: Test locally with real credentials
3. **This Week**: Deploy to Contabo VPS
4. **Next Week**: Configure domain and HTTPS
5. **Later**: Add monitoring and analytics

**Questions?** Check `FACEBOOK_OAUTH_SETUP.md` or `QUICK_START.md`

---

**Version**: 1.0
**Last Updated**: September 19, 2026
**Status**: Ready for Deployment 🚀
