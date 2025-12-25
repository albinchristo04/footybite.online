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

const DATA_URL = 'https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/events.json';
const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DOMAIN = 'https://footybite.online';

function normalizeEvent(stream, categoryName) {
    const startTime = stream.starts_at * 1000;
    const endTime = stream.ends_at * 1000;
    const now = Date.now();

    let status = 'upcoming';
    if (now >= startTime && now < endTime) status = 'live';
    else if (now >= endTime) status = 'finished';

    // Sport Resolution Rule (CRITICAL)
    let sport = 'other';
    const sportLower = categoryName.toLowerCase();
    const nameLower = stream.name.toLowerCase();
    const tagLower = (stream.tag || '').toLowerCase();

    if (sportLower.includes('soccer') ||
        sportLower.includes('football') && !sportLower.includes('american') ||
        nameLower.includes('premier league') ||
        nameLower.includes('la liga') ||
        nameLower.includes('uefa') ||
        tagLower.includes('soccer')) {
        sport = 'soccer';
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

    return {
        id: stream.id,
        sport,
        league: stream.tag || categoryName,
        teams,
        name: stream.name,
        startTime,
        endTime,
        status,
        thumbnail: stream.poster,
        iframe: stream.iframe,
        url: `${sport}/${format(new Date(startTime), 'yyyy-MM-dd')}/${slugify(stream.name, { lower: true, strict: true })}/`
    };
}

async function generate() {
    console.log('Starting generation...');
    await fs.ensureDir(DIST_DIR);
    await fs.copy(path.join(__dirname, 'style.css'), path.join(DIST_DIR, 'style.css'));

    const response = await axios.get(DATA_URL);
    const categories = response.data.events.streams;

    const allEvents = [];
    const sitemapEntries = [];

    // 1. Normalize all data
    for (const cat of categories) {
        for (const stream of cat.streams) {
            allEvents.push(normalizeEvent(stream, cat.category));
        }
    }

    // 2. Generate Match Pages
    for (const event of allEvents) {
        const discoverTitle = `LIVE: ${event.name} Free Stream - Don't Miss the Action!`;
        await renderPage(
            path.join(DIST_DIR, event.url, 'index.html'),
            'match',
            {
                title: `${event.name} Live Stream - Watch ${event.sport.toUpperCase()} Online Free`,
                h1: discoverTitle,
                description: `Watch ${event.name} free live stream online. Footybite coverage of ${event.sport}.`,
                canonical: `${DOMAIN}/${event.url}`,
                event,
                schema: generateMatchSchema(event)
            }
        );
        sitemapEntries.push(`${DOMAIN}/${event.url}`);
    }

    // 3. Generate Category Pages
    const sports = ['soccer', 'nfl', 'nba', 'boxing', 'f1'];
    for (const sport of sports) {
        const sportEvents = allEvents.filter(e => e.sport === sport);
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
                title: `Free ${sport.toUpperCase()} Live Streams | Footybite`,
                description: `Watch the best ${sport} live streams for free on Footybite.`,
                canonical: `${DOMAIN}/${catUrl}`,
                categoryName: sport.toUpperCase(),
                catSlug: sport,
                events: sportEvents,
                filterHtml,
                schema: generateCategorySchema(sport, catUrl)
            }
        );
        sitemapEntries.push(`${DOMAIN}/${catUrl}`);
    }

    // 4. Generate Homepage
    const homeFilterHtml = renderToString(React.createElement(FilterEngine, {
        initialEvents: allEvents,
        initialSport: 'all',
        isHomepage: true
    }));

    await renderPage(
        path.join(DIST_DIR, 'index.html'),
        'index',
        {
            title: 'Footybite | Free Live Sports Streaming | Soccer, NFL, NBA',
            description: 'Footybite is the best place for free soccer streams, NFL, NBA, and live sports streaming.',
            canonical: `${DOMAIN}/`,
            events: allEvents,
            filterHtml: homeFilterHtml,
            schema: generateHomeSchema()
        }
    );
    sitemapEntries.push(`${DOMAIN}/`);

    await generateSitemap(sitemapEntries);
    await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${DOMAIN}/sitemap.xml`);

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
        "location": { "@type": "Place", "name": "Online" }
    };
}

function generateCategorySchema(name, url) {
    return { "@context": "https://schema.org", "@type": "WebPage", "name": name, "url": `${DOMAIN}/${url}` };
}

function generateHomeSchema() {
    return { "@context": "https://schema.org", "@type": "WebSite", "name": "Footybite", "url": DOMAIN };
}

async function generateSitemap(entries) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(url => `  <url><loc>${url}</loc><changefreq>hourly</changefreq></url>`).join('\n')}
</urlset>`;
    await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), xml);
}

generate().catch(console.error);
