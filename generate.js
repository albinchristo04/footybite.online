const axios = require('axios');
const fs = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const slugify = require('slugify');
const { format, isAfter, isBefore, addHours } = require('date-fns');

const DATA_URL = 'https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/events.json';
const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DOMAIN = 'https://footybite.online';

async function generate() {
    console.log('Starting generation...');

    // Ensure dist directory exists and is empty
    await fs.emptyDir(DIST_DIR);

    // Copy CSS
    await fs.copy(path.join(__dirname, 'style.css'), path.join(DIST_DIR, 'style.css'));

    // Fetch data
    const response = await axios.get(DATA_URL);
    const data = response.data;
    const categories = data.events.streams;

    const allEvents = [];
    const sitemapEntries = [];

    // Process categories and events
    for (const cat of categories) {
        const catSlug = slugify(cat.category, { lower: true, strict: true });
        const catEvents = [];

        for (const stream of cat.streams) {
            const eventDate = new Date(stream.starts_at * 1000);
            const dateStr = format(eventDate, 'yyyy-MM-dd');
            const matchSlug = slugify(stream.name, { lower: true, strict: true });
            const url = `${catSlug}/${dateStr}/${matchSlug}/`;

            const event = {
                ...stream,
                url,
                catSlug,
                dateStr,
                time: format(eventDate, 'PPP p'),
                isLive: isBefore(new Date(), addHours(eventDate, 3)) && isAfter(new Date(), eventDate),
                category_name: cat.category
            };

            catEvents.push(event);
            allEvents.push(event);

            // Generate Match Page
            const discoverTitle = `LIVE: ${event.name} Free Stream - Don't Miss the Action!`;
            await renderPage(
                path.join(DIST_DIR, url, 'index.html'),
                'match',
                {
                    title: `${event.name} Live Stream - Watch ${event.category_name} Online Free`,
                    h1: discoverTitle,
                    description: `Watch ${event.name} free live stream online. Footybite coverage of ${event.category_name}. Fotybyte and Footybyte official streams.`,
                    canonical: `${DOMAIN}/${url}`,
                    event,
                    schema: generateMatchSchema(event)
                }
            );
            sitemapEntries.push(`${DOMAIN}/${url}`);
        }

        // Generate Category Page
        const catUrl = `${catSlug}/`;
        await renderPage(
            path.join(DIST_DIR, catUrl, 'index.html'),
            'category',
            {
                title: `Free ${cat.category} Live Streams | Watch ${cat.category} Online - Footybite`,
                description: `Watch the best ${cat.category} live streams for free. Footybite coverage of all ${cat.category} events. Fotybyte and Footybyte official site.`,
                canonical: `${DOMAIN}/${catUrl}`,
                categoryName: cat.category,
                events: catEvents,
                schema: generateCategorySchema(cat.category, catUrl)
            }
        );
        sitemapEntries.push(`${DOMAIN}/${catUrl}`);

        // Generate Date Pages (Optional, but good for SEO)
        const dates = [...new Set(catEvents.map(e => e.dateStr))];
        for (const d of dates) {
            const dateUrl = `${catSlug}/${d}/`;
            const dateEvents = catEvents.filter(e => e.dateStr === d);
            await renderPage(
                path.join(DIST_DIR, dateUrl, 'index.html'),
                'category',
                {
                    title: `${cat.category} Streams for ${d} | Live ${cat.category} Today`,
                    description: `Watch ${cat.category} live streams for ${d}. Free ${cat.category} online on Footybite, Fotybyte, and Footybyte.`,
                    canonical: `${DOMAIN}/${dateUrl}`,
                    categoryName: `${cat.category} (${d})`,
                    events: dateEvents,
                    schema: generateCategorySchema(`${cat.category} ${d}`, dateUrl)
                }
            );
            sitemapEntries.push(`${DOMAIN}/${dateUrl}`);
        }
    }

    // Generate Live Streams Hub
    await renderPage(
        path.join(DIST_DIR, 'live-streams', 'index.html'),
        'category',
        {
            title: 'Free Live Sports Streaming | Soccer, NFL, NBA Streams - Footybite',
            description: 'Watch all live sports streams for free on Footybite. The ultimate hub for soccer streams, NFL, NBA, and more. Fotybyte and Footybyte official site.',
            canonical: `${DOMAIN}/live-streams/`,
            categoryName: 'All Live Streams',
            events: allEvents,
            schema: generateCategorySchema('All Live Streams', 'live-streams/')
        }
    );
    sitemapEntries.push(`${DOMAIN}/live-streams/`);

    // Generate Homepage
    await renderPage(
        path.join(DIST_DIR, 'index.html'),
        'index',
        {
            title: 'Footybite | Free Live Sports Streaming | Soccer Streams, NFL, NBA',
            description: 'Footybite (Fotybyte) is the best place for free soccer streams, NFL, NBA, and live sports streaming. Watch Footybyte official streams online.',
            canonical: `${DOMAIN}/`,
            events: allEvents.slice(0, 50), // Show top 50 on home
            schema: generateHomeSchema()
        }
    );
    sitemapEntries.push(`${DOMAIN}/`);

    // Generate Sitemap
    await generateSitemap(sitemapEntries);

    // Generate Robots.txt
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
        "startDate": new Date(event.starts_at * 1000).toISOString(),
        "description": `Watch ${event.name} live stream on Footybite.`,
        "location": {
            "@type": "Place",
            "name": "Online"
        },
        "offers": {
            "@type": "Offer",
            "url": `${DOMAIN}/${event.url}`,
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        }
    };
}

function generateCategorySchema(name, url) {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": `${name} Live Streams`,
        "url": `${DOMAIN}/${url}`
    };
}

function generateHomeSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Footybite",
        "url": DOMAIN,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${DOMAIN}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };
}

async function generateSitemap(entries) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(url => `  <url><loc>${url}</loc><changefreq>hourly</changefreq></url>`).join('\n')}
</urlset>`;
    await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), xml);
}

generate().catch(console.error);
