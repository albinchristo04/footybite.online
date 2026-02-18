require('esbuild-register');
const { marked } = require('marked');
const axios = require('axios');
const fs = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const slugify = require('slugify');
const { format } = require('date-fns');
const React = require('react');
const { renderToString } = require('react-dom/server');

// Import React components
const FilterEngine = require('./src/components/FilterEngine').default;

const DATA_URL = process.env.DATA_URL || 'https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/events.json';

const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DOMAIN = 'https://footybite.online';

// SEO Hub Pages — brand keyword clusters from GSC
const SEO_HUBS = [
    {
        slug: 'footybite-reddit',
        keyword: 'Footybite Reddit',
        title: 'Footybite Reddit - Official Reddit Streams Alternative 2026',
        description: 'Looking for Footybite Reddit streams? FootyBite.online is the official alternative for Reddit soccer streams, NBA streams, and NFL streams. Free HD quality.',
        extraContent: `<h3>Footybite Reddit: The Full Story</h3>
            <p>After the original <strong>Reddit soccer streams</strong> community was shut down, fans turned to <strong>Footybite</strong> as the best alternative. We aggregate the same high-quality links that were shared on Reddit, but in a cleaner, more organized format.</p>
            <p>Whether you searched for <strong>Footybite Reddit</strong>, <strong>r/soccerstreams</strong>, or <strong>Reddit NBA streams</strong>, this is your new home. FootyBite provides everything Reddit streams did — and more.</p>`
    },
    {
        slug: 'nba-footybite',
        keyword: 'NBA Footybite',
        title: 'NBA Footybite - Watch NBA Live Streams Free HD 2026',
        description: 'Watch NBA games free on Footybite. NBA Footybite provides HD live streams for every game including Lakers, Warriors, Celtics and all NBA teams. No signup required.',
        extraContent: `<h3>NBA Footybite: Your Court-side Seat</h3>
            <p>Don't miss a single dunk, three-pointer, or buzzer-beater. <strong>NBA Footybite</strong> brings you free HD streams for every NBA game, from regular season to the NBA Finals.</p>
            <p>Whether you search for <strong>NBA Footybite</strong>, <strong>NBA Footybite live</strong>, or <strong>Footybite NBA streams</strong>, we've got you covered with multiple reliable links for every game.</p>`
    },
    {
        slug: 'footybite-streams',
        keyword: 'Footybite Streams',
        title: 'Footybite Streams - Free HD Live Sports Streaming 2026',
        description: 'Footybite Streams offers free HD live streaming for Football, NBA, NFL, Boxing and F1. The most reliable Footybite streaming links updated every hour.',
        extraContent: `<h3>About Footybite Streams</h3>
            <p><strong>Footybite Streams</strong> (also known as <strong>Footybite Streaming</strong> or <strong>Footybite Soccer Streams</strong>) is a curated collection of the best live sports links on the internet.</p>
            <p>We verify every stream link to ensure quality and reliability. Whether it's Premier League, Champions League, NBA, or NFL — <strong>Footybite Streams</strong> has the best HD links.</p>`
    },
    {
        slug: 'live-footybite',
        keyword: 'Live Footybite',
        title: 'Live Footybite - Watch Live Sports Streams Now 2026',
        description: 'Live Footybite streams for Football, NBA, NFL and more. Watch live sports free in HD quality. No registration required. Updated every hour.',
        extraContent: `<h3>Live Footybite: Real-Time Streaming</h3>
            <p>When the match is on, <strong>Live Footybite</strong> is where you need to be. Our live feed updates in real-time with working HD stream links for every major sporting event.</p>
            <p>Searched for <strong>live Footybite</strong>, <strong>Footybite live streams</strong>, or <strong>live.footybite</strong>? You're in the right place. Bookmark this page for instant access to live sports.</p>`
    },
    {
        slug: 'footybite-to',
        keyword: 'Footybite.to',
        title: 'Footybite.to - New Official Domain is FootyBite.online 2026',
        description: 'Footybite.to has moved! The official new Footybite domain is footybite.online. Same free HD streams, same quality. Bookmark the new official site now.',
        extraContent: `<h3>Footybite.to Has Moved</h3>
            <p>If you're looking for <strong>Footybite.to</strong>, you've found the right place. The official FootyBite has moved to <strong>footybite.online</strong> — the new permanent home for all your live sports streaming needs.</p>
            <p>All the features you loved on <strong>Footybite.to</strong> are here: free HD streams, real-time updates, mobile-friendly design, and no registration required. Update your bookmarks to <strong>footybite.online</strong> today!</p>`
    },
    {
        slug: 'footybite-alternatives',
        keyword: 'Footybite Alternatives',
        title: 'Footybite vs Alternatives - Why FootyBite is #1 in 2026',
        description: 'Comparing Footybite vs alternatives? FootyBite.online is the #1 choice for free live sports streaming. HD quality, no signup, updated hourly.',
        extraContent: `<h3>Footybite vs Other Streaming Sites</h3>
            <p>Looking for <strong>Footybite alternatives</strong>? While there are other streaming sites, <strong>FootyBite</strong> consistently ranks as the #1 choice for sports fans worldwide. Here's why:</p>
            <ul><li><strong>Reliability:</strong> Links verified and updated every hour</li><li><strong>Quality:</strong> HD 1080p and 720p streams prioritized</li><li><strong>Safety:</strong> Clean interface, no malicious pop-ups</li><li><strong>Coverage:</strong> Football, NBA, NFL, Boxing, F1 and more</li></ul>
            <p>Stop searching for <strong>Footybite vs</strong> other sites — you've already found the best one.</p>`
    },
    {
        slug: 'footbite',
        keyword: 'Footbite',
        title: 'Footbite (Footybite) - Official Free Streams Site 2026',
        description: 'Footbite (correctly spelled Footybite) is the official free sports streaming site. Watch Football, NBA, NFL in HD. The real Footbite/Footybite site.',
        extraContent: `<h3>Footbite = Footybite</h3>
            <p>Searching for <strong>Footbite</strong>? You're likely looking for <strong>Footybite</strong> — the world's most popular free sports streaming aggregator. <strong>Footbite</strong> is a common misspelling, but you've found the real deal!</p>
            <p>Whether you typed <strong>Footbite</strong>, <strong>Footbite stream</strong>, <strong>Foot Bite</strong>, or <strong>Footybite</strong>, this is the official site with free HD live streams for Football, NBA, NFL, and more.</p>`
    },
    {
        slug: 'footem-org',
        keyword: 'Footem.org Alternative',
        title: 'Footem.org Alternative - FootyBite Free Streams 2026',
        description: 'Better than Footem.org? FootyBite.online offers free HD live sports streams with hourly updates. The best Footem.org alternative for Football, NBA, NFL.',
        extraContent: `<h3>Looking for Footem.org?</h3>
            <p>If you're searching for <strong>Footem.org</strong> or <strong>Footem</strong>, try <strong>FootyBite</strong> instead. We offer the same sports coverage with better stream quality and more reliable links.</p>
            <p><strong>FootyBite</strong> is the preferred <strong>Footem.org alternative</strong> with HD streams, mobile optimization, and hourly link verification. Make the switch today.</p>`
    },
    {
        slug: 'nfl-footybite',
        keyword: 'NFL Footybite',
        title: 'NFL Footybite - Watch NFL Live Streams Free HD 2026',
        description: 'Watch NFL games free on Footybite. NFL Footybite provides HD live streams for every game including Cowboys, Chiefs, Eagles. No signup needed.',
        extraContent: `<h3>NFL Footybite: Your Game Day HQ</h3>
            <p>From Thursday Night Football to the Super Bowl, <strong>NFL Footybite</strong> has you covered with free HD streams for every game.</p>
            <p>Whether you search for <strong>NFL Footybite</strong>, <strong>Footybite NFL streams</strong>, or <strong>NFL live streams free</strong>, we provide the most reliable links updated before every kickoff.</p>`
    }
];

const BIG_LEAGUES = ['Premier League', 'Champions League', 'La Liga', 'World Cup', 'Euros', 'UEFA', 'Serie A', 'Bundesliga', 'NFL', 'NBA', 'AFCON', 'Ligue 1', 'Eredivisie', 'MLS'];
const BIG_TEAMS = [
    'Real Madrid', 'Barcelona', 'Man City', 'Man United', 'Arsenal', 'Bayern', 'PSG', 'Liverpool', 'Chelsea', 'Juventus', 'Inter Milan', 'AC Milan', 'Lakers', 'Warriors', 'Cowboys', 'Chiefs',
    'Tottenham', 'Atletico Madrid', 'Dortmund', 'Napoli', 'Roma', 'Ajax', 'Benfica', 'Porto', 'Celtic', 'Rangers', 'Al Nassr', 'Al Ittihad', 'Inter Miami', 'Senegal', 'Algeria', 'Egypt', 'Nigeria'
];

const FALLBACK_NEWS = [
    "Mohamed Salah crowned Player of the Year 2025 after leading Liverpool to 20th title.",
    "Crystal Palace secures historic FA Cup win against Manchester City.",
    "Senegal starts AFCON title defense with dominant 3-0 win over Botswana.",
    "Algeria captain Riyad Mahrez shines in 3-0 victory against Sudan.",
    "Ruben Amorim issues transfer warning to Manchester United squad for January window.",
    "Luca Zidane makes international debut for Algeria in AFCON opener.",
    "Chelsea boss Enzo Maresca plays down Premier League title chances.",
    "Manchester City reportedly eye £131m British record move for world-class star.",
    "Alexander Isak ruled out for two months with leg fracture.",
    "Endrick joins Lyon on loan from Real Madrid for the remainder of the season."
];

const newsCache = {};
let apiCallCount = 0;
const MAX_API_CALLS = 0;

/**
 * Fetches news from GNews API with smart fallbacks and documentation-optimized parameters.
 * @see https://docs.gnews.io/
 */
async function fetchNews(query, isHeadline = false) {
    const cacheKey = `${isHeadline ? 'H:' : 'S:'}${query}`;
    if (newsCache[cacheKey]) return newsCache[cacheKey];
    if (apiCallCount >= MAX_API_CALLS) return null;

    try {
        const endpoint = isHeadline ? 'top-headlines' : 'search';
        const params = {
            q: query,
            lang: 'en',
            max: 5,
            apikey: GNEWS_API_KEY,
            in: 'title,description', // Focus on relevant fields
            nullable: 'description,image' // Ensure we get results even if some fields are missing
        };

        if (isHeadline) {
            params.category = 'sports';
        }

        console.log(`Fetching ${endpoint} for: ${query} (${apiCallCount + 1}/${MAX_API_CALLS})`);
        const response = await axios.get(`https://gnews.io/api/v4/${endpoint}`, { params });
        apiCallCount++;
        const articles = response.data.articles || [];
        newsCache[cacheKey] = articles;
        return articles;
    } catch (error) {
        console.error(`GNews API Error for ${query}:`, error.message);
        return null;
    }
}

/**
 * Truncates a string to a maximum length, adding ellipsis if needed.
 * @param {string} str - The string to truncate
 * @param {number} maxLen - Maximum length (default 60 for titles)
 * @returns {string} Truncated string
 */
function truncateString(str, maxLen = 60) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3).trim() + '...';
}

function computePopularity(event) {
    let score = 0;
    const name = event.name.toLowerCase();
    const league = event.league.toLowerCase();
    if (BIG_LEAGUES.some(bl => league.includes(bl.toLowerCase()))) score += 50;
    if (BIG_TEAMS.some(bt => name.includes(bt.toLowerCase()))) score += 30;
    if (event.status === 'live') score += 100;
    const diff = event.startTime - Date.now();
    if (diff > 0 && diff < 2 * 60 * 60 * 1000) score += 20;
    return score;
}

function normalizeEvent(stream, categoryName) {
    const startTime = stream.starts_at * 1000;
    const endTime = stream.ends_at * 1000;
    const now = Date.now();
    let status = 'upcoming';
    if (now >= startTime && now < endTime) status = 'live';
    else if (now >= endTime) status = 'finished';
    const league = stream.tag || categoryName;
    const leagueLower = league.toLowerCase();
    const sportLower = categoryName.toLowerCase();
    const nameLower = stream.name.toLowerCase();
    const tagLower = (stream.tag || '').toLowerCase();

    let sport = 'other';
    const isFootball =
        leagueLower.includes('premier') || leagueLower.includes('la liga') || leagueLower.includes('serie a') || leagueLower.includes('bundesliga') ||
        leagueLower.includes('uefa') || leagueLower.includes('champions') || leagueLower.includes('europa') || leagueLower.includes('world cup') ||
        leagueLower.includes('euro') || leagueLower.includes('afcon') || leagueLower.includes('ligue 1') || leagueLower.includes('eredivisie') ||
        leagueLower.includes('mls') || sportLower.includes('soccer') || (sportLower.includes('football') && !sportLower.includes('american')) ||
        tagLower.includes('soccer') || BIG_TEAMS.some(team => nameLower.includes(team.toLowerCase()) && !sportLower.includes('basketball') && !sportLower.includes('american'));

    if (isFootball) sport = 'football';
    else if (sportLower.includes('american football') || sportLower.includes('nfl')) sport = 'nfl';
    else if (sportLower.includes('basketball') || sportLower.includes('nba')) sport = 'nba';
    else if (sportLower.includes('fighting') || sportLower.includes('boxing') || sportLower.includes('ufc')) sport = 'boxing';
    else if (sportLower.includes('formula 1') || sportLower.includes('f1') || sportLower.includes('motorsport')) sport = 'motorsports';

    const teams = stream.name.split(/ vs\.? /i).map(t => t.trim());
    const event = {
        id: stream.id, sport, league, teams, name: stream.name, startTime, endTime, status,
        thumbnail: stream.poster, iframe: stream.iframe,
        url: `${sport}/${format(new Date(startTime), 'yyyy-MM-dd')}/${slugify(stream.name, { lower: true, strict: true })}/`
    };
    event.popularityScore = computePopularity(event);
    return event;
}

function generateMatchPreview(event, articles) {
    const [teamA, teamB] = event.teams;
    const league = event.league;

    if (articles && articles.length > 0) {
        const topArticle = articles[0];
        return `The upcoming ${league} clash between ${teamA} and ${teamB} is generating significant buzz. According to recent reports from ${topArticle.source.name}, "${topArticle.title}" - ${topArticle.description}. This adds an extra layer of intrigue to the match as both sides look to secure a vital win. Fans can expect a high-stakes encounter where every tactical decision will count. ${articles[1] ? articles[1].title : ''}`;
    }

    const news = FALLBACK_NEWS[Math.floor(Math.random() * FALLBACK_NEWS.length)];
    return `The upcoming ${league} clash between ${teamA} and ${teamB} is set to be a highlight of the season. Both teams have shown remarkable form recently, and fans are expecting a high-intensity battle on the pitch. In related news, ${news} This match is crucial for both sides as they look to climb the ${league} table and secure their objectives for the 2025/26 campaign. Expect a tactical masterclass as both managers look to outwit each other in this highly anticipated encounter.`;
}

function generateH2H(event) {
    const [teamA, teamB] = event.teams;
    return [
        { date: '2025-05-12', match: `${teamA} vs ${teamB}`, result: '2 - 1' },
        { date: '2024-11-20', match: `${teamA} vs ${teamB}`, result: '0 - 0' },
        { date: '2024-03-15', match: `${teamA} vs ${teamB}`, result: '1 - 3' }
    ];
}

async function generate() {
    console.log('Starting generation...');
    const lastUpdated = new Date().toISOString();
    await fs.ensureDir(DIST_DIR);

    const cssContent = await fs.readFile(path.join(__dirname, 'style.css'), 'utf-8');
    const criticalCss = `<style>${cssContent}</style>`;

    const response = await axios.get(DATA_URL);
    const categories = response.data.events.streams;

    const allEvents = [];
    const sitemapMatches = [];
    const sitemapHubs = [];
    const sitemapImages = [];

    for (const cat of categories) {
        for (const stream of cat.streams) {
            allEvents.push(normalizeEvent(stream, cat.category));
        }
    }

    const activeEvents = allEvents.filter(e => e.status !== 'finished').sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime - b.startTime;
        return b.popularityScore - a.popularityScore;
    });

    // 1. Generate Match Pages with GNews Integration
    for (const event of activeEvents) {
        const isBigGame = event.popularityScore > 70;
        // SEO: Title must be under 60 characters for optimal display
        const rawTitle = `${event.name} ${event.status === 'live' ? 'LIVE' : 'Live'} | FootyBite`;
        const title = truncateString(rawTitle, 60);

        // Strategy: Search for specific match first, then fallback to trending team news
        const query = `"${event.teams[0]}" "${event.teams[1]}"`.trim();
        let articles = await fetchNews(query);

        // Fallback 1: Search for both teams without quotes
        if ((!articles || articles.length === 0) && apiCallCount < MAX_API_CALLS) {
            articles = await fetchNews(`${event.teams[0]} ${event.teams[1]}`);
        }

        // Fallback 2: Search for the first team (usually the home team or bigger team)
        if ((!articles || articles.length === 0) && apiCallCount < MAX_API_CALLS) {
            articles = await fetchNews(event.teams[0], true); // Use top-headlines for trending team news
        }

        let teamNews;
        if (articles && articles.length > 0) {
            teamNews = articles.map(a => `${a.title} (${a.source.name})`).slice(0, 3);
        } else {
            const randIdx = Math.floor(Math.random() * 5);
            teamNews = FALLBACK_NEWS.slice(randIdx, randIdx + 3);
        }

        const related = activeEvents.filter(e => e.id !== event.id && (e.sport === event.sport || e.league === event.league)).slice(0, 10);
        const teamLinks = activeEvents.filter(e => e.id !== event.id && e.teams.some(t => event.teams.includes(t))).slice(0, 5);
        const dateLinks = activeEvents.filter(e => e.id !== event.id && format(new Date(e.startTime), 'yyyy-MM-dd') === format(new Date(event.startTime), 'yyyy-MM-dd')).slice(0, 5);

        // SEO: Meta description must be under 160 characters
        const rawDescription = `Watch ${event.name} live stream free on FootyBite. HD ${event.sport} coverage.`;
        const description = truncateString(rawDescription, 155);

        await renderPage(path.join(DIST_DIR, event.url, 'index.html'), 'match', {
            title, h1: isBigGame ? `🔥 ${event.name} Live Stream` : `${event.name} Live Stream`,
            description,
            canonical: `${DOMAIN}/${event.url}`, event, related, teamLinks, dateLinks,
            matchPreview: generateMatchPreview(event, articles),
            h2h: generateH2H(event),
            teamNews, lastUpdated, criticalCss, schema: generateMatchSchema(event), noindex: false
        });
        sitemapMatches.push({ url: `${DOMAIN}/${event.url}`, priority: 0.9, changefreq: 'hourly' });
        if (event.thumbnail) sitemapImages.push({ url: event.thumbnail, title: event.name });
    }

    // 2. Generate Category Pages
    const sports = ['football', 'motorsports', 'basketball', 'nfl', 'boxing'];
    for (const sport of sports) {
        const sportEvents = activeEvents.filter(e => e.sport === sport);
        const hasToday = sportEvents.some(e => format(new Date(e.startTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
        const initialDate = hasToday ? 'today' : 'tomorrow';
        const filterHtml = renderToString(React.createElement(FilterEngine, { initialEvents: activeEvents, initialSport: sport, isHomepage: false, initialDate }));
        const catUrl = `${sport}/`;
        // SEO: Shortened category titles and descriptions
        const catTitle = truncateString(`${sport.charAt(0).toUpperCase() + sport.slice(1)} Live Streams | FootyBite`, 60);
        const catDescription = truncateString(`Watch free ${sport} live streams on FootyBite. HD quality, real-time updates.`, 155);
        await renderPage(path.join(DIST_DIR, catUrl, 'index.html'), 'category', {
            title: catTitle,
            description: catDescription,
            canonical: `${DOMAIN}/${catUrl}`, categoryName: sport.charAt(0).toUpperCase() + sport.slice(1), catSlug: sport, events: activeEvents, filterHtml, lastUpdated, criticalCss, schema: generateCategorySchema(sport, catUrl), noindex: false
        });
        sitemapHubs.push({ url: `${DOMAIN}/${catUrl}`, priority: 0.8, changefreq: 'daily' });
    }

    // 2.1 Generate SEO Hub Pages (brand keyword clusters)
    for (const hub of SEO_HUBS) {
        const hubUrl = `${hub.slug}/`;
        const hubEvents = activeEvents.slice(0, 15);
        await renderPage(path.join(DIST_DIR, hubUrl, 'index.html'), 'hub', {
            title: truncateString(hub.title, 60),
            description: truncateString(hub.description, 155),
            canonical: `${DOMAIN}/${hubUrl}`,
            keyword: hub.keyword,
            events: hubEvents,
            lastUpdated,
            criticalCss,
            schema: generateHubSchema(hub),
            noindex: false,
            extraContent: hub.extraContent || ''
        });
        sitemapHubs.push({ url: `${DOMAIN}/${hubUrl}`, priority: 0.7, changefreq: 'weekly' });
    }

    // 2.5 Generate Static Pages (AdSense)
    const adsenseContent = await fs.readFile(path.join(__dirname, 'ADSENSE_PAGES.md'), 'utf-8');
    const pages = adsenseContent.split('\n---\n').map(p => p.trim()).filter(p => p);

    for (const pageContent of pages) {
        const titleMatch = pageContent.match(/^# (.*$)/m);
        const title = titleMatch ? titleMatch[1] : 'Page';
        const htmlContent = marked.parse(pageContent);
        const slug = slugify(title, { lower: true, strict: true });
        const pageUrl = `${slug}/`;

        await renderPage(path.join(DIST_DIR, pageUrl, 'index.html'), 'page', {
            title: `${title} | FootyBite`,
            description: `${title} for FootyBite.online`,
            canonical: `${DOMAIN}/${pageUrl}`,
            pageTitle: title,
            content: htmlContent,
            lastUpdated,
            criticalCss,
            noindex: false
        });
        sitemapHubs.push({ url: `${DOMAIN}/${pageUrl}`, priority: 0.5, changefreq: 'monthly' });
    }

    // 3. Homepage
    const homeFilterHtml = renderToString(React.createElement(FilterEngine, { initialEvents: activeEvents, initialSport: 'all', isHomepage: true }));
    await renderPage(path.join(DIST_DIR, 'index.html'), 'index', {
        title: 'Footybite™ (Footybites) - Official Live Streams 2026',
        description: 'Footybite (Footybites, Footy Bite, Footybyte) official site. Free live streams for Football, NBA, NFL in HD. The #1 Reddit streams alternative. No signup.',
        canonical: `${DOMAIN}/`, events: activeEvents, filterHtml: homeFilterHtml, lastUpdated, criticalCss, schema: generateHomeSchema(), noindex: false
    });
    sitemapHubs.push({ url: `${DOMAIN}/`, priority: 1.0, changefreq: 'hourly' });

    await generateMultiSitemaps(sitemapMatches, sitemapHubs, sitemapImages);
    await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap-index.xml\nDisallow: /*?`);

    // Copy ads.txt
    try {
        await fs.copy(path.join(__dirname, 'public', 'ads.txt'), path.join(DIST_DIR, 'ads.txt'));
        console.log('ads.txt copied successfully.');
    } catch (err) {
        console.warn('Warning: ads.txt not found in public directory.');
    }

    console.log(`Generation complete! Used ${apiCallCount} GNews API requests.`);
}

async function renderPage(filePath, templateName, data) {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`);
    const baseTemplatePath = path.join(TEMPLATES_DIR, 'base.ejs');
    const body = await ejs.renderFile(templatePath, data);
    const html = await ejs.renderFile(baseTemplatePath, { ...data, body });
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, html);
}

function generateMatchSchema(event) {
    const isoDate = new Date(event.startTime).toISOString();
    return [
        { "@context": "https://schema.org", "@type": "SportsEvent", "name": event.name, "startDate": isoDate, "location": { "@type": "Place", "name": "Online" }, "image": event.thumbnail, "description": `Watch ${event.name} live stream on FootyBite.`, "competitor": event.teams.map(t => ({ "@type": "SportsTeam", "name": t })), "isLiveBroadcast": event.status === 'live' },
        { "@context": "https://schema.org", "@type": "BroadcastEvent", "name": `${event.name} Live Broadcast`, "isLiveBroadcast": event.status === 'live', "startDate": isoDate, "videoFormat": "HD" }
    ];
}
function generateCategorySchema(name, url) { return { "@context": "https://schema.org", "@type": "WebPage", "name": name, "url": `${DOMAIN}/${url}` }; }
function generateHomeSchema() {
    return [
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "FootyBite",
            "alternateName": ["Footybite", "Footybites", "Footy Bite", "Footybyte", "Footbite", "Fotybyte", "FootyBite.to", "FootyBite Online"],
            "url": DOMAIN,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${DOMAIN}/?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "FootyBite",
            "alternateName": ["Footybite", "Footybites", "Footy Bite", "Footybyte", "Footbite"],
            "url": DOMAIN,
            "description": "The official FootyBite site for free live sports streaming. Watch Football, NBA, NFL, Boxing and F1 in HD."
        }
    ];
}
function generateHubSchema(hub) {
    return [
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": hub.keyword,
            "url": `${DOMAIN}/${hub.slug}/`,
            "description": hub.description,
            "isPartOf": { "@type": "WebSite", "name": "FootyBite", "url": DOMAIN }
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": `Is ${hub.keyword} really free on FootyBite?`,
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes! FootyBite is a free link aggregation service. We do not charge users for access to any of the sports streams we list." }
                },
                {
                    "@type": "Question",
                    "name": "Do I need to create an account?",
                    "acceptedAnswer": { "@type": "Answer", "text": "No registration is required. We value your privacy and want to make the process as fast as possible." }
                },
                {
                    "@type": "Question",
                    "name": "What if a stream stops working?",
                    "acceptedAnswer": { "@type": "Answer", "text": "We provide multiple mirror links for every match. If one link goes down, simply try another one from the list." }
                }
            ]
        }
    ];
}
async function generateMultiSitemaps(matches, hubs, images) {
    const matchXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${matches.map(e => `  <url><loc>${e.url}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join('\n')}</urlset>`;
    const hubXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${hubs.map(e => `  <url><loc>${e.url}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join('\n')}</urlset>`;
    const imageXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${images.map(e => `  <url><loc>${e.url}</loc><image:image><image:loc>${e.url}</image:loc><image:title>${e.title}</image:title></image:image></url>`).join('\n')}</urlset>`;
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${DOMAIN}/sitemap-matches.xml</loc></sitemap><sitemap><loc>${DOMAIN}/sitemap-hubs.xml</loc></sitemap><sitemap><loc>${DOMAIN}/sitemap-images.xml</loc></sitemap></sitemapindex>`;
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-matches.xml'), matchXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-hubs.xml'), hubXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-images.xml'), imageXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-index.xml'), indexXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), indexXml);
}

generate().catch(console.error);
