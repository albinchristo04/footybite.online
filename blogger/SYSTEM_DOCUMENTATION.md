# FootyBite Blogger System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Files Created](#files-created)
4. [Setup Instructions](#setup-instructions)
5. [How It Works](#how-it-works)
6. [SEO Strategy](#seo-strategy)
7. [Validation Checklist](#validation-checklist)

---

## 🎯 System Overview

The FootyBite Blogger system is an **autonomous migration + automation system** that replicates the FootyBite SEO system inside Blogger using:

- ✅ Custom Blogger Theme (XML)
- ✅ Blogger REST API (OAuth 2.0)
- ✅ GitHub Actions (Hourly automation)
- ✅ Static JSON feed (events.json)

**Primary Goal:** Rank on Google using Blogger's domain trust + programmatic posting

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  .github/workflows/blogger-publish.yml              │    │
│  │  (Runs every hour via cron)                         │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  blogger/scripts/blogger-publish.js                 │    │
│  │  (Main automation script)                           │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  blogger/scripts/post-generator.js                  │    │
│  │  (Converts events.json → Blogger HTML)              │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   events.json (External)     │
        │   (Match data source)        │
        └─────────────┬─────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Blogger API (OAuth 2.0)    │
        │   (Post creation/update)     │
        └─────────────┬─────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   YOUR-BLOG.blogspot.com     │
        │   (Live Blogger site)        │
        └──────────────────────────────┘
```

---

## 📁 Files Created

### 1. **blogger/theme.xml** (Blogger Theme)
- **Purpose**: Custom dark sports UI theme for Blogger
- **Features**:
  - Mobile-first responsive design
  - Glassmorphism effects
  - Countdown timer JavaScript
  - SEO-optimized HTML structure
  - No external dependencies (Blogger-safe)

### 2. **blogger/scripts/post-generator.js** (Post Generator)
- **Purpose**: Converts events.json into Blogger-ready HTML posts
- **Generates**:
  - Match posts (with iframe gating, H2H, news, FAQs)
  - Hub posts (Football, NFL, NBA, Boxing, F1)
  - Brand posts (footybite, footybyte, fotybyte)
- **Features**:
  - Sport detection algorithm
  - Schema markup generation
  - 30-minute iframe gating logic
  - Fallback news content

### 3. **blogger/scripts/blogger-publish.js** (API Client)
- **Purpose**: Publishes posts to Blogger via REST API
- **Features**:
  - OAuth 2.0 authentication
  - Post CRUD operations (Create, Read, Update, Delete)
  - Intelligent sync logic
  - Rate limiting (1 req/sec)
  - Error handling

### 4. **blogger/scripts/get-refresh-token.js** (OAuth Setup)
- **Purpose**: One-time script to obtain OAuth refresh token
- **Usage**: Run once during initial setup

### 5. **.github/workflows/blogger-publish.yml** (Automation)
- **Purpose**: GitHub Actions workflow for hourly publishing
- **Schedule**: Runs every hour (`0 * * * *`)
- **Triggers**: Cron schedule + manual dispatch

### 6. **blogger/package.json** (Dependencies)
- **Dependencies**:
  - `axios` - HTTP client for API calls
  - `date-fns` - Date formatting
  - `slugify` - URL slug generation

### 7. **blogger/README.md** (Full Documentation)
- Complete setup guide
- Troubleshooting tips
- SEO optimization strategies
- Success metrics

### 8. **blogger/QUICKSTART.md** (Quick Start)
- 5-minute setup guide
- Essential steps only

---

## 🚀 Setup Instructions

### Prerequisites
- Google account
- GitHub repository
- Blogger blog

### Step-by-Step Setup

#### 1. Create Blogger Blog
```
1. Visit https://www.blogger.com
2. Click "Create New Blog"
3. Name: FootyBite (or your choice)
4. URL: footybite.blogspot.com
5. Save Blog ID from Settings → Basic
```

#### 2. Upload Custom Theme
```
1. Blogger Dashboard → Theme
2. Edit HTML
3. Delete all existing code
4. Paste contents of blogger/theme.xml
5. Save theme
```

#### 3. Configure Blogger Settings
```
Settings → Search preferences:
- Enable custom robots.txt
- Enable custom robots header tags
- Add meta description

Settings → Basic:
- Enable HTTPS
- Set description
```

#### 4. Get OAuth Credentials

**A. Create Google Cloud Project**
```
1. Go to https://console.cloud.google.com
2. Create new project: "FootyBite Blogger"
3. Enable "Blogger API v3"
```

**B. Create OAuth Client**
```
1. Credentials → Create Credentials → OAuth client ID
2. Application type: Desktop app
3. Name: FootyBite Publisher
4. Download JSON credentials
5. Note client_id and client_secret
```

**C. Get Refresh Token**
```bash
cd blogger
npm install

export BLOGGER_CLIENT_ID="your_client_id"
export BLOGGER_CLIENT_SECRET="your_client_secret"

node scripts/get-refresh-token.js
```

Follow the prompts to authorize and get your refresh token.

#### 5. Configure GitHub Secrets
```
Repository → Settings → Secrets and variables → Actions

Add these 4 secrets:
- BLOGGER_CLIENT_ID: (from step 4B)
- BLOGGER_CLIENT_SECRET: (from step 4B)
- BLOGGER_REFRESH_TOKEN: (from step 4C)
- BLOGGER_BLOG_ID: (from step 1)
```

#### 6. Enable GitHub Actions
```
1. Go to Actions tab
2. Enable workflows if disabled
3. Manually trigger "Blogger Auto Publisher" to test
```

---

## ⚙️ How It Works

### Automated Workflow (Hourly)

```
1. GitHub Actions triggers (every hour)
   ↓
2. Fetch events.json from external URL
   ↓
3. Normalize events (detect sport, status, teams)
   ↓
4. Generate Blogger posts:
   - Match posts (upcoming/live only)
   - Hub posts (if not exist)
   - Brand posts (if not exist)
   ↓
5. Authenticate with Blogger API (OAuth)
   ↓
6. Fetch existing posts from Blogger
   ↓
7. For each generated post:
   - If new → CREATE post
   - If exists + status changed → UPDATE post
   - If finished → SKIP
   ↓
8. Log results (created/updated/skipped/errors)
   ↓
9. Done! (Wait 1 hour, repeat)
```

### Post Types

#### 1. Match Posts
**Example**: `arsenal-vs-chelsea-live-stream.html`

**Content Includes**:
- H1: Match title (with "LIVE" if live)
- Match info card (teams, league, time, status)
- Player section with iframe OR countdown overlay
- Team news (3 articles)
- H2H stats (3 previous matches)
- Match preview paragraph
- FAQs (4 questions)
- Schema markup (SportsEvent)

**Iframe Gating Logic**:
```javascript
const now = Date.now();
const showIframe = (event.startTime - now) <= 30 * 60 * 1000 || isLive;

if (showIframe) {
    // Show iframe
} else {
    // Show countdown overlay
}
```

**Update Triggers**:
- Match goes LIVE → Title updated to add "LIVE"
- Match finishes → Post not updated (skipped)

#### 2. Hub Posts
**Examples**: 
- `football-live-stream.html`
- `nfl-live-stream.html`
- `nba-live-stream.html`

**Content**: 900-1200 words of SEO-optimized content about the sport, including:
- Why choose FootyBite
- How to watch
- Popular competitions
- FAQs

**Purpose**: Rank for broad keywords like "football live stream"

#### 3. Brand Posts
**Examples**:
- `footybite.html`
- `footybyte.html`
- `fotybyte.html`

**Content**: Brand information, features, sports covered

**Purpose**: Capture brand SERP and common misspellings

### Sync Logic

```javascript
for (const newPost of generatedPosts) {
    const existing = findPostBySlug(existingPosts, newPost.slug);
    
    if (existing) {
        // Post exists
        if (statusChanged(existing, newPost)) {
            // Update if match went live or finished
            updatePost(existing.id, newPost);
        } else {
            // Skip if no changes
            skip();
        }
    } else {
        // New post
        if (newPost.status !== 'finished') {
            createPost(newPost);
        }
    }
}
```

---

## 🔍 SEO Strategy

### On-Page SEO

✅ **Dynamic Titles**
- Format: `{Team A} vs {Team B} [LIVE] Stream Free | FootyBite`
- Includes target keywords: team names, "live", "stream", "free"

✅ **Meta Descriptions**
- Auto-generated from match details
- Includes league, time, and CTA

✅ **Schema Markup**
- Type: `SportsEvent`
- Properties: name, startDate, location, competitors, isLiveBroadcast
- Embedded as JSON-LD in post body

✅ **Heading Hierarchy**
- H1: Match title
- H2: Section titles (Match Info, Team News, H2H, FAQs)
- H3-H4: Sub-sections

✅ **Internal Linking**
- Hub posts link to match posts
- Match posts link to hub posts
- Brand posts link to everything

### Technical SEO

✅ **Custom Robots.txt**
```
User-agent: *
Allow: /
Sitemap: https://YOUR-BLOG.blogspot.com/sitemap.xml
```

✅ **Sitemap**
- Auto-generated by Blogger
- Submitted to Google Search Console

✅ **HTTPS**
- Enabled by default on Blogger

✅ **Mobile-Responsive**
- Custom theme is mobile-first
- Passes Google Mobile-Friendly Test

✅ **Page Speed**
- Minimal CSS (inlined)
- No external dependencies
- Lazy loading images

### Content SEO

✅ **Fresh Content**
- Updated hourly via automation
- Real-time match status updates

✅ **Long-Form Content**
- Hub posts: 900-1200 words
- Match posts: 500-800 words

✅ **FAQs**
- Targets featured snippets
- Answers common user questions

✅ **Labels (Categories)**
- Each post has 5-10 labels
- Examples: Football, Live, Premier League, Arsenal, Chelsea

### Link Building

✅ **Internal Links**
- Hub → Match posts
- Match → Hub posts
- Brand → All posts

✅ **External Links**
- None (to avoid link juice leakage)

---

## ✅ Validation Checklist

### Pre-Launch Checklist

- [ ] Blogger blog created
- [ ] Custom theme uploaded and saved
- [ ] Blog set to public
- [ ] HTTPS enabled
- [ ] Custom robots.txt configured
- [ ] Meta description added
- [ ] Google Cloud project created
- [ ] Blogger API v3 enabled
- [ ] OAuth client ID created
- [ ] Refresh token obtained
- [ ] GitHub Secrets configured (all 4)
- [ ] GitHub Actions enabled
- [ ] Workflow manually triggered (test run)
- [ ] Test post created successfully
- [ ] Test post visible on blog
- [ ] Countdown timer works
- [ ] Iframe gating works (30-min rule)
- [ ] Schema markup validates (use Google Rich Results Test)
- [ ] Mobile responsive (use Google Mobile-Friendly Test)
- [ ] Page speed acceptable (use PageSpeed Insights)

### Post-Launch Validation

**Day 1:**
- [ ] Verify hourly workflow runs
- [ ] Check for errors in Actions logs
- [ ] Confirm new posts appear on blog
- [ ] Test countdown on upcoming match
- [ ] Test iframe appears when live

**Week 1:**
- [ ] Submit sitemap to Google Search Console
- [ ] Verify posts are indexed (`site:YOUR-BLOG.blogspot.com`)
- [ ] Check for crawl errors in Search Console
- [ ] Monitor workflow success rate

**Month 1:**
- [ ] Track keyword rankings
- [ ] Monitor organic traffic
- [ ] Analyze top-performing posts
- [ ] Optimize based on data

### Hard Fail Conditions ❌

The system FAILS if:
- ❌ No real match data in posts
- ❌ Countdown timer missing or broken
- ❌ Iframe shown before 30-minute gate
- ❌ Duplicate slugs created
- ❌ Posts have no labels
- ❌ No schema markup
- ❌ Workflow fails for 24+ hours
- ❌ OAuth token expired and not refreshed

### Success Conditions ✅

The system SUCCEEDS if:
- ✅ Blogger auto-posts hourly
- ✅ Posts update when matches go LIVE
- ✅ Countdown + iframe gating works
- ✅ Football matches appear correctly
- ✅ Pages index faster than custom domain
- ✅ Rankings move toward Top-20

---

## 📊 Expected Results

### Indexing Timeline
- **0-24 hours**: Posts indexed by Google
- **1-7 days**: Appear in search results (long-tail)
- **2-4 weeks**: Rankings for competitive keywords
- **1-3 months**: Consistent organic traffic

### Ranking Targets
- **Week 1**: Top 100 for long-tail (e.g., "arsenal vs chelsea live stream free")
- **Month 1**: Top 50 for medium-tail (e.g., "premier league live stream")
- **Month 3**: Top 20 for competitive (e.g., "football live stream")

### Traffic Projections
- **Month 1**: 100-500 visits/month
- **Month 3**: 1,000-5,000 visits/month
- **Month 6**: 10,000+ visits/month

---

## 🔧 Maintenance

### Daily
- Monitor GitHub Actions for failures
- Check Blogger dashboard for spam comments

### Weekly
- Review top-performing posts
- Check Google Search Console for errors
- Verify OAuth token still valid

### Monthly
- Analyze traffic and rankings
- Optimize underperforming content
- Update hub posts with fresh content

### Quarterly
- Regenerate OAuth token (if needed)
- Review and update SEO strategy
- Expand to new sports/leagues

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Invalid credentials" error
**Solution**: 
- Verify GitHub Secrets are correct
- Regenerate refresh token
- Check OAuth consent screen

**Issue**: "Post not created" error
**Solution**:
- Check API quota in Google Cloud Console
- Verify blog ID is correct
- Ensure blog is public

**Issue**: Countdown not working
**Solution**:
- Verify theme.xml uploaded correctly
- Check browser console for JS errors
- Ensure `data-start` attribute present

**Issue**: Workflow not running
**Solution**:
- Check if Actions are enabled
- Verify cron syntax
- Manually trigger to test

---

## 📞 Support Resources

- [Blogger API Documentation](https://developers.google.com/blogger)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Google Search Console](https://search.google.com/search-console)

---

## 🎉 Conclusion

You now have a **complete, autonomous Blogger publishing system** that:

✅ Automatically publishes sports content hourly
✅ Leverages Blogger's domain authority
✅ Implements advanced SEO techniques
✅ Updates in real-time as matches go live
✅ Requires zero manual intervention

**Next Steps:**
1. Complete the setup checklist
2. Monitor the first week closely
3. Submit sitemap to Google
4. Track rankings and traffic
5. Optimize based on data

**Good luck with your rankings! 🚀**
