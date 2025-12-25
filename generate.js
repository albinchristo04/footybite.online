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
if (!DATA_URL) {
    console.error('Error: DATA_URL environment variable is not set.');
    process.exit(1);
}

const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DOMAIN = 'https://footybite.online';

const BIG_LEAGUES = ['Premier League', 'Champions League', 'La Liga', 'World Cup', 'Euros', 'UEFA', 'Serie A', 'Bundesliga', 'NFL', 'NBA'];
const BIG_TEAMS = ['Real Madrid', 'Barcelona', 'Man City', 'Man United', 'Arsenal', 'Bayern', 'PSG', 'Liverpool', 'Chelsea', 'Juventus', 'Inter Milan', 'AC Milan', 'Lakers', 'Warriors', 'Cowboys', 'Chiefs'];

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
    if (
        sportLower.includes('soccer') ||
        (sportLower.includes('football') && !sportLower.includes('american')) ||
        leagueLower.includes('premier') ||
        leagueLower.includes('la liga') ||
        leagueLower.includes('serie a') ||
        leagueLower.includes('bundesliga') ||
        leagueLower.includes('uefa') ||
        leagueLower.includes('champions') ||
        tagLower.includes('soccer')
    ) {
        sport = 'football';
    } else if (sportLower.includes('american football') || sportLower.includes('nfl')) {
        sport = 'nfl';
    } else if (sportLower.includes('basketball') || sportLower.includes('nba')) {
        sport = 'nba';
    } else if (sportLower.includes('fighting') || sportLower.includes('boxing') || sportLower.includes('ufc')) {
        sport = 'boxing';
    } else if (sportLower.includes('formula 1') || sportLower.includes('f1')) {
        sport = 'f1';
    }

    const teams = stream.name.split(/ vs\.? /i).map(t => t.trim());

    const event = {
        id: stream.id,
        sport,
        league,
        teams,
        name: stream.name,
        startTime,
        endTime,
        status,
        thumbnail: stream.poster,
        iframe: stream.iframe,
        url: `${sport}/${format(new Date(startTime), 'yyyy-MM-dd')}/${slugify(stream.name, { lower: true, strict: true })}/`
    };

    event.popularityScore = computePopularity(event);
    return event;
}

async function generate() {
    console.log('Starting generation...');
    const lastUpdated = new Date().toISOString();
    await fs.ensureDir(DIST_DIR);

    // Inline Critical CSS
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

    const activeEvents = allEvents.filter(e => e.status !== 'finished');
    const finishedEvents = allEvents.filter(e => e.status === 'finished');

    // 1. Generate Match Pages (Live & Upcoming)
    for (const event of activeEvents) {
        const isBigGame = event.popularityScore > 70;
        const livePrefix = event.status === 'live' ? '🔴 LIVE: ' : '';
        const title = `${livePrefix}${event.name} LIVE Stream Free | FootyBite`;

        const related = activeEvents
            .filter(e => e.id !== event.id && (e.sport === event.sport || e.league === event.league))
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, 10);

        await renderPage(
            path.join(DIST_DIR, event.url, 'index.html'),
            'match',
            {
                title,
                h1: isBigGame ? `🔥 MUST WATCH: ${event.name} Live Stream` : `${event.name} LIVE Stream`,
                description: `Watch ${event.name} LIVE stream free on FootyBite. Kickoff at ${new Date(event.startTime).toLocaleTimeString()}. High quality ${event.sport} coverage.`,
                canonical: `${DOMAIN}/${event.url}`,
                event,
                related,
                lastUpdated,
                criticalCss,
                schema: generateMatchSchema(event),
                noindex: false
            }
        );
        sitemapMatches.push({ url: `${DOMAIN}/${event.url}`, priority: 0.9, changefreq: 'hourly' });
        if (event.thumbnail) sitemapImages.push({ url: event.thumbnail, title: event.name });
    }

    // 2. Generate Replay Pages (Finished Matches)
    for (const event of finishedEvents) {
        const replayUrl = `replay/${slugify(event.name, { lower: true, strict: true })}-full-match-replay/`;
        await renderPage(
            path.join(DIST_DIR, replayUrl, 'index.html'),
            'match',
            {
                title: `${event.name} Full Match Replay | FootyBite`,
                h1: `${event.name} Replay`,
                description: `Watch ${event.name} full match replay on FootyBite. Missed the live action? Catch up here.`,
                canonical: `${DOMAIN}/${replayUrl}`,
                event: { ...event, status: 'finished' },
                related: activeEvents.slice(0, 6),
                lastUpdated,
                criticalCss,
                schema: generateMatchSchema(event),
                noindex: false
            }
        );
        sitemapMatches.push({ url: `${DOMAIN}/${replayUrl}`, priority: 0.6, changefreq: 'daily' });
    }

    // 3. Generate Team Long-Tail Pages
    const teams = [...new Set(allEvents.flatMap(e => e.teams))];
    for (const team of teams) {
        const teamSlug = slugify(team, { lower: true, strict: true });
        const teamUrl = `football/${teamSlug}-live-stream/`;
        const teamEvents = activeEvents.filter(e => e.teams.includes(team));

        await renderPage(
            path.join(DIST_DIR, teamUrl, 'index.html'),
            'longtail',
            {
                title: `${team} LIVE Stream Free Today | FootyBite`,
                h1: `${team} Live Stream`,
                description: `Watch ${team} live stream free. Get the latest ${team} match links and schedules on FootyBite.`,
                canonical: `${DOMAIN}/${teamUrl}`,
                subject: team,
                events: teamEvents,
                lastUpdated,
                criticalCss,
                noindex: false
            }
        );
        sitemapHubs.push({ url: `${DOMAIN}/${teamUrl}`, priority: 0.7, changefreq: 'daily' });
    }

    // 4. Generate League Long-Tail Pages
    const leagues = [...new Set(allEvents.map(e => e.league))];
    for (const league of leagues) {
        const leagueSlug = slugify(league, { lower: true, strict: true });
        const leagueUrl = `${leagueSlug}-live-stream-today/`;
        const leagueEvents = activeEvents.filter(e => e.league === league);

        await renderPage(
            path.join(DIST_DIR, leagueUrl, 'index.html'),
            'longtail',
            {
                title: `${league} LIVE Stream Free Today | FootyBite`,
                h1: `${league} Live Stream`,
                description: `Watch ${league} live stream free today. High quality links for all ${league} matches on FootyBite.`,
                canonical: `${DOMAIN}/${leagueUrl}`,
                subject: league,
                events: leagueEvents,
                lastUpdated,
                criticalCss,
                noindex: false
            }
        );
        sitemapHubs.push({ url: `${DOMAIN}/${leagueUrl}`, priority: 0.7, changefreq: 'daily' });
    }

    // 5. Generate Category Pages
    const sports = ['football', 'nfl', 'nba', 'boxing', 'f1'];
    for (const sport of sports) {
        const sportEvents = activeEvents.filter(e => e.sport === sport);
        const filterHtml = renderToString(React.createElement(FilterEngine, {
            initialEvents: sportEvents,
            initialSport: sport,
            isHomepage: false
        }));

        const catUrl = `${sport}/`;
        await renderPage(
            path.join(DIST_DIR, catUrl, 'index.html'),
            'category',
            {
                title: `${sport.toUpperCase()} LIVE Stream Free | FootyBite`,
                description: `Watch the best ${sport} live streams for free on FootyBite. Real-time updates for all matches.`,
                canonical: `${DOMAIN}/${catUrl}`,
                categoryName: sport.charAt(0).toUpperCase() + sport.slice(1),
                catSlug: sport,
                events: sportEvents,
                filterHtml,
                lastUpdated,
                criticalCss,
                schema: generateCategorySchema(sport, catUrl),
                noindex: false
            }
        );
        sitemapHubs.push({ url: `${DOMAIN}/${catUrl}`, priority: 0.8, changefreq: 'daily' });
    }

    // 6. Generate Keyword Hubs
    const hubs = [
        { slug: 'live-streams', keyword: 'Live Streams' },
        { slug: 'free-live-stream', keyword: 'Free Live Stream' },
        { slug: 'football-live-tv', keyword: 'Football Live TV' },
        { slug: 'nba-live-stream', keyword: 'NBA Live Stream' },
        { slug: 'nfl-live-stream', keyword: 'NFL Live Stream' },
        { slug: 'boxing-live-stream', keyword: 'Boxing Live Stream' },
        { slug: 'f1-live-stream', keyword: 'F1 Live Stream' }
    ];
    for (const hub of hubs) {
        await renderPage(
            path.join(DIST_DIR, hub.slug, 'index.html'),
            'hub',
            {
                title: `${hub.keyword} LIVE Stream Free | FootyBite`,
                description: `Looking for ${hub.keyword}? FootyBite offers the best free sports streaming links for ${hub.keyword} and more.`,
                canonical: `${DOMAIN}/${hub.slug}/`,
                keyword: hub.keyword,
                events: activeEvents.slice(0, 20),
                lastUpdated,
                criticalCss,
                noindex: false
            }
        );
        sitemapHubs.push({ url: `${DOMAIN}/${hub.slug}/`, priority: 0.8, changefreq: 'daily' });
    }

    // 7. Brand Pages
    const brands = ['footybite', 'footybyte', 'fotybyte'];
    for (const brand of brands) {
        await renderPage(
            path.join(DIST_DIR, brand, 'index.html'),
            'brand',
            {
                title: `${brand.toUpperCase()} Official Site - Free Sports Streaming`,
                description: `Official FootyBite sports streaming site. Watch live football, NFL, NBA, and more for free.`,
                canonical: `${DOMAIN}/${brand}/`,
                brandName: brand,
                lastUpdated,
                criticalCss,
                noindex: false
            }
        );
        sitemapHubs.push({ url: `${DOMAIN}/${brand}/`, priority: 0.8, changefreq: 'daily' });
    }

    // 8. Homepage
    const homeFilterHtml = renderToString(React.createElement(FilterEngine, {
        initialEvents: activeEvents,
        initialSport: 'all',
        isHomepage: true
    }));

    await renderPage(
        path.join(DIST_DIR, 'index.html'),
        'index',
        {
            title: 'FootyBite | Free Live Sports Streaming 🔴 Football, NFL, NBA',
            description: 'FootyBite is the #1 place for free football streams, NFL, NBA, and live sports. Watch in HD for free.',
            canonical: `${DOMAIN}/`,
            events: activeEvents,
            filterHtml: homeFilterHtml,
            lastUpdated,
            criticalCss,
            schema: generateHomeSchema(),
            noindex: false
        }
    );
    sitemapHubs.push({ url: `${DOMAIN}/`, priority: 1.0, changefreq: 'hourly' });

    await generateMultiSitemaps(sitemapMatches, sitemapHubs, sitemapImages);
    await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap-index.xml\nDisallow: /*?`);

    console.log('Generation complete!');
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
    return {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": event.name,
        "startDate": new Date(event.startTime).toISOString(),
        "location": { "@type": "Place", "name": "Online" },
        "image": event.thumbnail,
        "description": `Watch ${event.name} live stream on FootyBite.`,
        "isLiveBroadcast": event.status === 'live'
    };
}

function generateCategorySchema(name, url) {
    return { "@context": "https://schema.org", "@type": "WebPage", "name": name, "url": `${DOMAIN}/${url}` };
}

function generateHomeSchema() {
    return { "@context": "https://schema.org", "@type": "WebSite", "name": "FootyBite", "url": DOMAIN };
}

async function generateMultiSitemaps(matches, hubs, images) {
    const matchXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${matches.map(e => `  <url><loc>${e.url}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join('\n')}
</urlset>`;

    const hubXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${hubs.map(e => `  <url><loc>${e.url}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join('\n')}
</urlset>`;

    const imageXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images.map(e => `  <url><loc>${e.url}</loc><image:image><image:loc>${e.url}</image:loc><image:title>${e.title}</image:title></image:image></url>`).join('\n')}
</urlset>`;

    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${DOMAIN}/sitemap-matches.xml</loc></sitemap>
  <sitemap><loc>${DOMAIN}/sitemap-hubs.xml</loc></sitemap>
  <sitemap><loc>${DOMAIN}/sitemap-images.xml</loc></sitemap>
</sitemapindex>`;

    await fs.writeFile(path.join(DIST_DIR, 'sitemap-matches.xml'), matchXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-hubs.xml'), hubXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-images.xml'), imageXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap-index.xml'), indexXml);
    await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), indexXml);
}

generate().catch(console.error);
