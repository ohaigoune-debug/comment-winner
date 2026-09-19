# Facebook OAuth Setup Guide - Comment Winner App

## Overview
This guide will help you configure your Facebook App for OAuth authentication in the Comment Winner application. The app is ready to use Facebook OAuth; you just need to set up the Facebook Developer App.

## Step 1: Create a Facebook Developer Account

1. Go to https://developers.facebook.com
2. Click "Get Started" if you don't have an account
3. Create an account or log in with your existing Facebook account

## Step 2: Create a New Facebook App

1. In the dashboard, click "My Apps" at the top
2. Click "Create App"
3. Select **App Type**: Choose "Consumer" for personal use or "Business" for business
4. Fill in the required details:
   - **App Name**: "Comment Winner" (or your preferred name)
   - **App Purpose**: Select appropriate category (Social Media or Business)
   - **App Contact Email**: Your email address
5. Click "Create App"

## Step 3: Add Facebook Login Product

1. In your app dashboard, find "Products" section
2. Click "Add Product"
3. Search for "Facebook Login"
4. Click "Set Up"
5. Choose "Web" as your platform

## Step 4: Configure App Settings

### Basic Settings
1. Go to **Settings > Basic**
2. Copy your **App ID** (you'll need this)
3. Copy your **App Secret** (keep this private!)
4. Note the **App Domain** section

### Facebook Login Settings
1. Go to **Products > Facebook Login > Settings**
2. In **Valid OAuth Redirect URIs**, add these URLs:
   - For local development: `http://localhost:3000/`
   - For Render deployment: `https://comment-winner.onrender.com/`
   - For Contabo VPS: `https://yourdomain.com/` (replace with your actual domain)
3. Click "Save Changes"

## Step 5: Configure Permissions

1. Go to **Settings > Permissions**
2. Ensure these permissions are available for your app:
   - `pages_read_engagement` - Read page and conversation insights (for Facebook)
   - `instagram_basic` - Access Instagram profile info (for Instagram)
   - `instagram_manage_insights` - Access Instagram Insights (optional)

3. Go to **Settings > Advanced**
4. In "Business Settings", if needed, add the permissions explicitly

## Step 6: Update Your App with the App ID

### For Local Development:
1. Open `/home/user/comment-winner/public/index.html`
2. Find this line (line 9):
```html
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/ar_AR/sdk.js#xfbml=1&version=v18.0&appId=1234567890" id="facebook-jssdk"></script>
```
3. Replace `1234567890` with your actual **App ID**
4. Save the file

### Example (with sample App ID):
```html
<script async defer crossorigin="anonymous" src="https://connect.facebook.net/ar_AR/sdk.js#xfbml=1&version=v18.0&appId=123456789012345" id="facebook-jssdk"></script>
```

## Step 7: Test Locally

1. Start the app locally:
```bash
cd /home/user/comment-winner
npm install
npm run dev
```

2. Open http://localhost:3000 in your browser
3. Click ⚙️ الإعدادات (Settings)
4. Click 👤 الدخول عبر حسابي بـ Facebook
5. You should see a Facebook login popup
6. Approve the permissions
7. You should see a success message with your user ID
8. The token will be automatically saved and populated in the token field

## Step 8: Deploy to Render (if using)

1. Go to your Render dashboard for the comment-winner service
2. Go to **Environment**
3. Add or update:
   - `RENDER_EXTERNAL_URL`: Your Render app URL (e.g., https://comment-winner.onrender.com)

4. Redeploy the app (if needed)
5. Update your Facebook App's OAuth Redirect URIs to include the Render URL

## Step 9: Deploy to Contabo (Optional)

For production on your Contabo VPS:

1. Ensure you have your domain set up pointing to your Contabo VPS
2. Update Facebook App OAuth Redirect URI with your domain
3. Deploy the app:
```bash
ssh user@your-contabo-ip
cd /path/to/comment-winner
npm install
npm run start
```

4. Make sure you're using HTTPS (configure with nginx + Let's Encrypt)

## Troubleshooting

### "Facebook SDK لم يتحمل بعد" (Facebook SDK not loaded)
- Wait a moment after page load and try again
- Check browser console for any CORS errors
- Ensure your domain is in the Facebook App's Valid OAuth Redirect URIs

### Login popup doesn't appear
- Check if pop-ups are blocked in your browser
- Verify the App ID is correct in the HTML
- Check if the app is in development mode - add test users if needed

### Token not saving
- Check browser's localStorage is enabled
- Open Developer Tools (F12) and look at Application > Local Storage
- Clear browser cache and try again

### "App not set up" error
- Make sure you added Facebook Login product to your app
- Verify OAuth Redirect URIs are correct
- Make sure your app is not in development mode with limited access

## App ID Reference

When you complete this setup, your Comment Winner app will:
1. Display a Facebook login button in the Settings modal
2. Allow users to authenticate with their Facebook account
3. Automatically capture the access token
4. Store it securely in the browser's localStorage
5. Use it to fetch comments from Facebook and Instagram

## Security Notes

✅ Token is stored locally in browser localStorage
✅ Token is never sent to any server except Meta's Graph API
✅ App Secret is not exposed to the frontend
✅ All API calls use HTTPS

## Next Steps

1. ✅ Create Facebook Developer Account
2. ✅ Create a new App
3. ✅ Add Facebook Login Product
4. ✅ Configure Redirect URIs
5. ✅ Update App ID in public/index.html
6. ✅ Test locally
7. ✅ Deploy when ready

Once you've completed these steps, your Comment Winner app will have full Facebook OAuth functionality!
