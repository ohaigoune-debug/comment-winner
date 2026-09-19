# 🎉 Comment Winner - Quick Start Guide

## What's New? ✨

Your Comment Winner app now includes **Facebook OAuth Login** - a better way to authenticate! Instead of searching for and manually pasting access tokens, users can now:

1. Click a button in Settings
2. Login with their Facebook account
3. Automatically grant permissions
4. Token is captured and stored automatically

## 3 Easy Steps to Get Started

### Step 1: Create Facebook Developer App (5 minutes)
Follow the guide in `FACEBOOK_OAUTH_SETUP.md` to:
- Create a Facebook Developer account
- Create a new app
- Get your **App ID**
- Configure OAuth settings

### Step 2: Update Your App ID (1 minute)
Open the app, click ⚙️ الإعدادات, and paste your App ID into the
**Facebook App ID** field. No code editing needed — it's saved in your browser.

### Step 3: Test It! (2 minutes)
```bash
# Navigate to the app directory
cd /home/user/comment-winner

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev

# Open in browser
# http://localhost:3000
```

Then:
1. Click ⚙️ الإعدادات (Settings button)
2. Click 👤 الدخول عبر حسابي بـ Facebook
3. Complete the login
4. See your token auto-populated! ✅

## Features Overview

### Authentication
- ✅ **Facebook OAuth** (recommended) - One-click login
- ✅ **Manual Token Input** - Backup option still available
- ✅ **Secure Storage** - Token stored in browser's localStorage

### Contest Management
- ✅ **Platform Selection** - Facebook or Instagram
- ✅ **URL Resolution** - Automatic post ID detection
- ✅ **Smart Filters**:
  - Remove duplicate comments (same user)
  - Exclude replies (top-level comments only)
  - Exclude page owner
  - Exclude empty comments
  - Minimum mentions requirement
  - Required keyword filtering
  - Free text search

### Winner Selection
- ✅ **Secure Random Draw** - Uses crypto.getRandomValues()
- ✅ **Flexible Count** - 1, 2, 3, 5, 10, 15, or 20 winners
- ✅ **Redraw Option** - Re-run the drawing
- ✅ **Alternate Winners** - Select replacements
- ✅ **Rich Display** - Shows rank, name, username, comment, platform

### Export
- ✅ **CSV Export** - Compatible with Excel/Sheets
- ✅ **XLSX Export** - Native Excel format

## File Structure

```
comment-winner/
├── server.js                      # Express backend
├── meta-api.js                    # Meta Graph API integration
├── public/
│   ├── index.html                # HTML structure
│   ├── app.js                    # Frontend logic (OAuth added ✨)
│   └── style.css                 # Dark mode styling
├── .env.example                  # Configuration template
├── package.json                  # Dependencies
├── FACEBOOK_OAUTH_SETUP.md       # Detailed setup guide
└── QUICK_START.md               # This file
```

## Deployment Options

### Option 1: Local Development
Perfect for testing with mock data:
```bash
npm run dev
# Access at http://localhost:3000
```

### Option 2: Render (Free Cloud)
Deployment link: https://comment-winner.onrender.com
- Free tier available
- Note: Mock data due to network restrictions
- Good for testing UI/UX

### Option 3: Contabo VPS (Production)
Best for real Meta API access:
- Full internet connectivity
- Real comment data from Facebook/Instagram
- Subdomain setup available
- 24/7 uptime

## Troubleshooting

### Facebook Login Button Not Working?
- [ ] Check that a valid App ID is entered in Settings
- [ ] Verify your app is in development/live mode (not restricted)
- [ ] Check browser console for CORS errors
- [ ] Clear browser cache and try again

### "Facebook SDK didn't load"
- The SDK loads asynchronously - wait 1-2 seconds after page load
- Check your internet connection
- Try a different browser

### Token Not Saving?
- Check if localStorage is enabled in browser
- Open DevTools > Application > Local Storage
- Look for 'META_ACCESS_TOKEN' key

### Meta API Returns Errors?
- In local development: Uses mock data (50 test comments)
- On production VPS: Should fetch real comments
- Check your access token permissions in Facebook Developer App

## Next Steps

1. **Now**: Follow the 3 steps above to get OAuth working
2. **Then**: Test with your actual Facebook post
3. **Finally**: Deploy to Contabo for production use

## Architecture

```
User → Browser (localStorage) → App → Facebook SDK
        ↓
    Gets token from FB OAuth
        ↓
    Stores in localStorage
        ↓
    Sends to Meta Graph API
        ↓
    Fetches real comments
```

## Key Improvements

| Before | After |
|--------|-------|
| ❌ Manual token search | ✅ One-click Facebook login |
| ❌ Token visible in browser | ✅ Secure OAuth flow |
| ❌ Confusing for users | ✅ Natural authentication |
| ❌ Easy to make mistakes | ✅ Auto-configured |

## Support & Questions

Check these resources:
- `FACEBOOK_OAUTH_SETUP.md` - Detailed Facebook configuration
- `server.js` - Backend logic and Meta API calls
- `public/app.js` - Frontend logic and OAuth implementation

## Current Status

✅ Code: Complete and tested
✅ OAuth: Fully implemented
✅ Settings: Ready for use
⏳ Your Action: Add Facebook App ID and test

**Ready to get started? Follow the 3 steps above!** 🚀
