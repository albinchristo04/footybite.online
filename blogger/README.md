# FootyBite Blogger Migration System

## 🎯 Overview

This system automatically publishes FootyBite content to Blogger using the Blogger API, leveraging Blogger's domain authority for faster Google indexing and rankings.

## 📁 Structure

```
blogger/
├── theme.xml                    # Blogger XML theme (upload to Blogger)
├── scripts/
│   ├── post-generator.js        # Converts events.json to Blogger posts
│   └── blogger-publish.js       # Publishes posts via Blogger API
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🚀 Setup Guide

### Step 1: Create Blogger Blog

1. Go to https://www.blogger.com
2. Create a new blog (e.g., `footybite.blogspot.com`)
3. Note your **Blog ID** (found in Settings → Basic)

### Step 2: Install Custom Theme

1. In Blogger dashboard, go to **Theme**
2. Click **Customize** → **Edit HTML**
3. Delete all existing code
4. Copy the entire contents of `theme.xml`
5. Paste into the editor
6. Click **Save**

### Step 3: Configure Blogger Settings

**Settings → Basic:**
- Enable HTTPS
- Set blog description: "Free live sports streaming - Football, NFL, NBA, Boxing"

**Settings → Search preferences:**
- Enable custom robots.txt:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://YOUR-BLOG.blogspot.com/sitemap.xml
  ```
- Enable custom robots header tags
- Add meta description

**Settings → Other:**
- Set blog to public
- Enable search engines to index

### Step 4: Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g., "FootyBite Blogger")
3. Enable **Blogger API v3**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Desktop app**
6. Download JSON credentials
7. Note your `client_id` and `client_secret`

### Step 5: Get Refresh Token

Run this one-time setup script:

```bash
cd blogger
npm install

# Replace with your credentials
node -e "
const axios = require('axios');
const readline = require('readline');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const authUrl = \`https://accounts.google.com/o/oauth2/v2/auth?client_id=\${CLIENT_ID}&redirect_uri=\${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/blogger&access_type=offline&prompt=consent\`;

console.log('1. Open this URL in your browser:');
console.log(authUrl);
console.log('\\n2. Authorize the app');
console.log('3. Copy the authorization code');
console.log('4. Paste it here:');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Authorization code: ', async (code) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    console.log('\\n✅ Success! Your refresh token:');
    console.log(response.data.refresh_token);
    console.log('\\nSave this token - you\\'ll need it for GitHub Secrets');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  rl.close();
});
"
```

### Step 6: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

```
BLOGGER_CLIENT_ID=your_client_id_here
BLOGGER_CLIENT_SECRET=your_client_secret_here
BLOGGER_REFRESH_TOKEN=your_refresh_token_here
BLOGGER_BLOG_ID=your_blog_id_here
```

### Step 7: Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. Enable workflows if disabled
3. The `Blogger Auto Publisher` workflow will now run hourly

## 🔄 How It Works

### Automated Workflow

```
Every Hour:
  ↓
Fetch events.json
  ↓
Generate Blogger posts
  ↓
Check existing posts
  ↓
Create new posts (upcoming matches)
Update existing posts (status changes)
Skip finished matches
  ↓
Done!
```

### Post Types Generated

#### 1. Match Posts
- **Slug**: `arsenal-vs-chelsea-live-stream.html`
- **Content**:
  - Match info (teams, league, time)
  - Countdown timer
  - Iframe (30-minute gate)
  - H2H stats
  - Team news
  - FAQs
  - Schema markup

#### 2. Hub Posts
- **Slugs**: `football-live-stream.html`, `nfl-live-stream.html`, etc.
- **Content**:
  - 900-1200 words
  - SEO-optimized descriptions
  - Links to match posts
  - FAQs

#### 3. Brand Posts
- **Slugs**: `footybite.html`, `footybyte.html`, `fotybyte.html`
- **Content**:
  - Brand information
  - Internal linking
  - SERP capture

### Update Logic

- **New match detected** → Create post
- **Match goes LIVE** → Update title to add "LIVE"
- **Match finishes** → Skip (don't create/update)

## 🧪 Testing

### Test Post Generation

```bash
cd blogger
npm run generate
```

This will output JSON of all generated posts.

### Test Publish (Dry Run)

```bash
# Set environment variables
export BLOGGER_CLIENT_ID="your_id"
export BLOGGER_CLIENT_SECRET="your_secret"
export BLOGGER_REFRESH_TOKEN="your_token"
export BLOGGER_BLOG_ID="your_blog_id"

# Run publisher
npm run publish
```

## 📊 Monitoring

### Check Workflow Status

1. Go to **Actions** tab in GitHub
2. View **Blogger Auto Publisher** runs
3. Check logs for errors

### Verify Posts on Blogger

1. Go to Blogger dashboard
2. Navigate to **Posts**
3. Verify new posts are created/updated

### Check Indexing

```bash
# Check if posts are indexed
site:YOUR-BLOG.blogspot.com "live stream"
```

## 🔧 Troubleshooting

### "Invalid credentials" error

- Verify GitHub Secrets are correct
- Regenerate refresh token if expired
- Check OAuth consent screen is configured

### "Post not created" error

- Check API quota (Blogger API has limits)
- Verify blog ID is correct
- Ensure blog is public

### "Duplicate post" error

- The system should auto-detect duplicates
- Manually delete duplicate posts in Blogger
- Re-run workflow

### Countdown not working

- Verify `theme.xml` is uploaded correctly
- Check browser console for JavaScript errors
- Ensure `data-start` attribute is present

## 📈 SEO Optimization

### On-Page SEO
- ✅ Dynamic titles with keywords
- ✅ Meta descriptions
- ✅ Schema markup (SportsEvent)
- ✅ H1-H6 hierarchy
- ✅ Internal linking

### Technical SEO
- ✅ Custom robots.txt
- ✅ Sitemap auto-generated by Blogger
- ✅ HTTPS enabled
- ✅ Mobile-responsive theme

### Content SEO
- ✅ 900+ words for hub posts
- ✅ FAQs for featured snippets
- ✅ Real-time updates (hourly)
- ✅ Keyword-rich labels

## 🎯 Success Metrics

Track these metrics to measure success:

1. **Indexing Speed**: How fast new posts appear in Google
2. **Rankings**: Position for target keywords
3. **Traffic**: Organic visits from Google
4. **CTR**: Click-through rate from search results

### Expected Timeline

- **Week 1**: Posts indexed within 24 hours
- **Week 2-4**: Rankings appear for long-tail keywords
- **Month 2-3**: Top 20 rankings for competitive keywords
- **Month 3+**: Consistent traffic growth

## 🚨 Important Notes

### Rate Limits

- Blogger API: 50 requests per second
- Our script: 1 request per second (safe)
- Daily quota: Check Google Cloud Console

### Content Policy

- Ensure compliance with Blogger's Terms of Service
- Don't host copyrighted content
- Aggregate links only (not hosting streams)

### Maintenance

- Monitor GitHub Actions for failures
- Update OAuth tokens if expired (every ~6 months)
- Check Blogger dashboard weekly

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| OAuth expired | Regenerate refresh token |
| API quota exceeded | Wait 24 hours or request increase |
| Posts not updating | Check workflow logs |
| Theme broken | Re-upload theme.xml |

### Resources

- [Blogger API Documentation](https://developers.google.com/blogger)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## ✅ Checklist

Before going live, ensure:

- [ ] Blogger blog created
- [ ] Custom theme uploaded
- [ ] OAuth credentials obtained
- [ ] Refresh token generated
- [ ] GitHub Secrets configured
- [ ] Workflow enabled
- [ ] Test post created successfully
- [ ] Countdown timer works
- [ ] Iframe gating works (30-min rule)
- [ ] Schema markup validates
- [ ] Mobile responsive
- [ ] HTTPS enabled

## 🎉 You're Ready!

Once all steps are complete, the system will:
- ✅ Auto-publish posts every hour
- ✅ Update posts when matches go live
- ✅ Maintain SEO-optimized content
- ✅ Leverage Blogger's domain authority
- ✅ Drive organic traffic from Google

**Good luck with your rankings! 🚀**
