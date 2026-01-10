# FootyBite Blogger - Quick Start

## 🚀 5-Minute Setup

### 1. Create Blogger Blog
```
1. Go to https://www.blogger.com
2. Click "Create New Blog"
3. Name: FootyBite (or your choice)
4. URL: footybite.blogspot.com
5. Click "Create blog"
```

### 2. Upload Theme
```
1. Blogger Dashboard → Theme
2. Click dropdown next to "Customize" → Edit HTML
3. Delete all code
4. Copy/paste contents of blogger/theme.xml
5. Save theme
```

### 3. Get Credentials

**Blog ID:**
```
Settings → Basic → Blog ID (copy this number)
```

**OAuth Credentials:**
```
1. https://console.cloud.google.com
2. Create project "FootyBite"
3. Enable "Blogger API v3"
4. Credentials → Create OAuth Client ID
5. Type: Desktop app
6. Download JSON → note client_id & client_secret
```

**Refresh Token:**
```bash
# Run this script (replace YOUR_CLIENT_ID and YOUR_CLIENT_SECRET)
node blogger/scripts/get-refresh-token.js
```

### 4. Add GitHub Secrets
```
Repository → Settings → Secrets → Actions

Add these 4 secrets:
- BLOGGER_CLIENT_ID
- BLOGGER_CLIENT_SECRET  
- BLOGGER_REFRESH_TOKEN
- BLOGGER_BLOG_ID
```

### 5. Enable Workflow
```
Actions tab → Enable workflows
```

## ✅ Done!

Posts will auto-publish every hour.

## 🧪 Test Manually

```bash
cd blogger
npm install

export BLOGGER_CLIENT_ID="..."
export BLOGGER_CLIENT_SECRET="..."
export BLOGGER_REFRESH_TOKEN="..."
export BLOGGER_BLOG_ID="..."

npm run publish
```

## 📊 Verify

1. Check Blogger dashboard for new posts
2. Visit your blog: `https://YOUR-BLOG.blogspot.com`
3. Search Google: `site:YOUR-BLOG.blogspot.com`

## 🆘 Issues?

See full README.md for troubleshooting.
