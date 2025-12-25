require('esbuild-register');
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

const DATA_URL = process.env.DATA_URL;
const GNEWS_API_KEY = '16e8a69fb00be06b4ad746ccd75cb285';

if (!DATA_URL) {
    console.error('Error: DATA_URL environment variable is not set.');
    process.exit(1);
}

const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DOMAIN = 'https://footybite.online';

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
const MAX_API_CALLS = 95;

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

    const activeEvents = allEvents.filter(e => e.status !== 'finished').sort((a, b) => b.popularityScore - a.popularityScore);

    // 1. Generate Match Pages with GNews Integration
    for (const event of activeEvents) {
        const isBigGame = event.popularityScore > 70;
        const title = `${event.name} ${event.status === 'live' ? 'LIVE Stream' : 'Live Stream Free'} | FootyBite`;

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

        await renderPage(path.join(DIST_DIR, event.url, 'index.html'), 'match', {
            title, h1: isBigGame ? `🔥 MUST WATCH: ${event.name} Live Stream` : `${event.name} LIVE Stream`,
            description: `Watch ${event.name} LIVE stream free on FootyBite. Kickoff at ${new Date(event.startTime).toLocaleTimeString()}. High quality ${event.sport} coverage.`,
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
        await renderPage(path.join(DIST_DIR, catUrl, 'index.html'), 'category', {
            title: `${sport.toUpperCase()} LIVE Stream Free | FootyBite`,
            description: `Watch the best ${sport} live streams for free on FootyBite. Real-time updates for all matches.`,
            canonical: `${DOMAIN}/${catUrl}`, categoryName: sport.charAt(0).toUpperCase() + sport.slice(1), catSlug: sport, events: activeEvents, filterHtml, lastUpdated, criticalCss, schema: generateCategorySchema(sport, catUrl), noindex: false
        });
        sitemapHubs.push({ url: `${DOMAIN}/${catUrl}`, priority: 0.8, changefreq: 'daily' });
    }

    // 3. Homepage
    const homeFilterHtml = renderToString(React.createElement(FilterEngine, { initialEvents: activeEvents, initialSport: 'all', isHomepage: true }));
    await renderPage(path.join(DIST_DIR, 'index.html'), 'index', {
        title: 'FootyBite | Free Live Sports Streaming 🔴 Football, NFL, NBA',
        description: 'FootyBite is the #1 place for free football streams, NFL, NBA, and live sports. Watch in HD for free.',
        canonical: `${DOMAIN}/`, events: activeEvents, filterHtml: homeFilterHtml, lastUpdated, criticalCss, schema: generateHomeSchema(), noindex: false
    });
    sitemapHubs.push({ url: `${DOMAIN}/`, priority: 1.0, changefreq: 'hourly' });

    await generateMultiSitemaps(sitemapMatches, sitemapHubs, sitemapImages);
    await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap-index.xml\nDisallow: /*?`);
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
function generateHomeSchema() { return { "@context": "https://schema.org", "@type": "WebSite", "name": "FootyBite", "url": DOMAIN }; }
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
