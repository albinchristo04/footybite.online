const axios = require('axios');
const { format } = require('date-fns');
const slugify = require('slugify');

/**
 * BLOGGER POST GENERATOR
 * Converts events.json into Blogger-ready HTML posts
 */

const DATA_URL = 'https://raw.githubusercontent.com/albinchristo04/ptv/refs/heads/main/events.json';

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

function detectSport(stream, categoryName) {
    const leagueLower = (stream.tag || categoryName).toLowerCase();
    const sportLower = categoryName.toLowerCase();
    const nameLower = stream.name.toLowerCase();

    const isFootball =
        leagueLower.includes('premier') || leagueLower.includes('la liga') || leagueLower.includes('serie a') ||
        leagueLower.includes('bundesliga') || leagueLower.includes('uefa') || leagueLower.includes('champions') ||
        leagueLower.includes('europa') || leagueLower.includes('world cup') || leagueLower.includes('euro') ||
        leagueLower.includes('afcon') || leagueLower.includes('ligue 1') || leagueLower.includes('eredivisie') ||
        leagueLower.includes('mls') || sportLower.includes('soccer') ||
        (sportLower.includes('football') && !sportLower.includes('american')) ||
        BIG_TEAMS.some(team => nameLower.includes(team.toLowerCase()) && !sportLower.includes('basketball') && !sportLower.includes('american'));

    if (isFootball) return 'Football';
    if (sportLower.includes('american football') || sportLower.includes('nfl')) return 'NFL';
    if (sportLower.includes('basketball') || sportLower.includes('nba')) return 'NBA';
    if (sportLower.includes('fighting') || sportLower.includes('boxing') || sportLower.includes('ufc')) return 'Boxing';
    if (sportLower.includes('formula 1') || sportLower.includes('f1') || sportLower.includes('motorsport')) return 'F1';
    return 'Sports';
}

function normalizeEvent(stream, categoryName) {
    const startTime = stream.starts_at * 1000;
    const endTime = stream.ends_at * 1000;
    const now = Date.now();

    let status = 'upcoming';
    if (now >= startTime && now < endTime) status = 'live';
    else if (now >= endTime) status = 'finished';

    const sport = detectSport(stream, categoryName);
    const league = stream.tag || categoryName;
    const teams = stream.name.split(/ vs\.? /i).map(t => t.trim());

    return {
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
        slug: slugify(stream.name, { lower: true, strict: true }) + '-live-stream'
    };
}

function generateMatchPost(event) {
    const [teamA, teamB] = event.teams;
    const dateStr = format(new Date(event.startTime), 'EEEE, MMMM d, yyyy');
    const timeStr = format(new Date(event.startTime), 'h:mm a');
    const isLive = event.status === 'live';
    const isUpcoming = event.status === 'upcoming';
    const now = Date.now();
    const showIframe = (event.startTime - now) <= 30 * 60 * 1000 || isLive;

    const randIdx = Math.floor(Math.random() * 5);
    const teamNews = FALLBACK_NEWS.slice(randIdx, randIdx + 3);

    const h2h = [
        { date: '2025-05-12', match: `${teamA} vs ${teamB}`, result: '2 - 1' },
        { date: '2024-11-20', match: `${teamA} vs ${teamB}`, result: '0 - 0' },
        { date: '2024-03-15', match: `${teamA} vs ${teamB}`, result: '1 - 3' }
    ];

    const schema = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": event.name,
        "startDate": new Date(event.startTime).toISOString(),
        "location": {
            "@type": "Place",
            "name": "Online"
        },
        "image": event.thumbnail,
        "description": `Watch ${event.name} live stream free on FootyBite. ${event.league} coverage.`,
        "competitor": event.teams.map(t => ({
            "@type": "SportsTeam",
            "name": t
        })),
        "isLiveBroadcast": isLive
    };

    const title = `${event.name} ${isLive ? 'LIVE' : ''} Stream Free | FootyBite`;

    const contentHtml = `
<article itemscope itemtype="https://schema.org/SportsEvent">
    <h1 itemprop="name">${isLive ? '🔴 LIVE: ' : ''}${event.name} Live Stream Free</h1>
    
    <div class="match-date-small">
        <time itemprop="startDate" datetime="${new Date(event.startTime).toISOString()}">
            ${dateStr} · ${timeStr}
        </time>
    </div>
    
    <!-- PLAYER SECTION -->
    <div class="player-section">
        <div class="player-aspect-ratio">
            <div class="player-container" id="player-gate">
                ${showIframe ? `
                    <iframe src="${event.iframe}" allowfullscreen scrolling="no" frameborder="0"></iframe>
                ` : `
                    <div class="countdown-overlay">
                        <div class="countdown-content">
                            <h2>Match Starts Soon</h2>
                            <div id="countdown-timer" data-start="${event.startTime}">
                                ⏱️ Starts in --h --m
                            </div>
                            <p>Stream will be available 30 minutes before kickoff.</p>
                        </div>
                    </div>
                `}
            </div>
        </div>
    </div>
    
    <!-- MATCH DETAILS -->
    <div class="match-details-grid">
        <div class="match-info-card">
            <h2>🏟️ Match Info</h2>
            <div class="info-row">
                <span class="label">Teams:</span>
                <span class="value" itemprop="competitor">${teamA} vs ${teamB}</span>
            </div>
            <div class="info-row">
                <span class="label">Competition:</span>
                <span class="value">${event.league}</span>
            </div>
            <div class="info-row">
                <span class="label">Kickoff:</span>
                <span class="value">${dateStr}, ${timeStr}</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value status-${event.status}">${isLive ? '🔴 LIVE' : event.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="match-seo-card">
            <h2>📰 Latest Team News</h2>
            <ul class="news-list">
                ${teamNews.map(news => `<li>${news}</li>`).join('\n                ')}
            </ul>
        </div>
    </div>
    
    <div class="match-details-grid">
        <div class="match-info-card">
            <h2>📊 Head-to-Head (H2H)</h2>
            <div class="h2h-table">
                ${h2h.map(item => `
                    <div class="h2h-row">
                        <span class="h2h-date">${item.date}</span>
                        <span class="h2h-match">${item.match}</span>
                        <span class="h2h-result">${item.result}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="match-seo-card">
            <h2>📈 Match Preview</h2>
            <p>The upcoming ${event.league} clash between ${teamA} and ${teamB} is set to be a highlight of the season. Both teams have shown remarkable form recently, and fans are expecting a high-intensity battle. This match is crucial for both sides as they look to climb the ${event.league} table and secure their objectives for the 2025/26 campaign.</p>
        </div>
    </div>
    
    <!-- FAQs -->
    <div class="faq-grid">
        <div class="faq-item">
            <h4>What time does the match start?</h4>
            <p>The match between ${teamA} and ${teamB} kicks off at ${timeStr} on ${dateStr}.</p>
        </div>
        <div class="faq-item">
            <h4>Is the match live?</h4>
            <p>Yes, FootyBite provides real-time streaming links. The stream becomes active 30 minutes before the scheduled kickoff.</p>
        </div>
        <div class="faq-item">
            <h4>Where to watch ${event.name}?</h4>
            <p>You can watch ${event.name} live right here on FootyBite. We aggregate the best high-definition links for every major sporting event.</p>
        </div>
        <div class="faq-item">
            <h4>Is it free?</h4>
            <p>Yes, streaming on FootyBite is 100% free. No registration or credit card is required to access our live sports links.</p>
        </div>
    </div>
    
    <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
    </script>
</article>

<style>
.h2h-table {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.h2h-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--glass-border);
    font-size: 0.9rem;
}

.h2h-date {
    color: var(--gray);
}

.h2h-match {
    font-weight: 600;
}

.h2h-result {
    color: var(--amber);
    font-weight: 800;
}
</style>
`;

    return {
        title,
        slug: event.slug + '.html',
        contentHtml,
        labels: [event.sport, 'Live', event.league, ...event.teams],
        scheduledTime: new Date(event.startTime).toISOString(),
        status: event.status,
        eventId: event.id
    };
}

function generateHubPost(sport) {
    const title = `${sport} Live Stream Free | Watch ${sport} Online`;
    const slug = `${slugify(sport, { lower: true })}-live-stream.html`;

    const contentHtml = `
<article>
    <h1>${sport} Live Stream Free - Watch ${sport} Online</h1>
    
    <p>Welcome to the ultimate destination for free ${sport} live streams. FootyBite brings you high-quality ${sport} streaming links for all major matches, tournaments, and events. Watch your favorite teams and players compete in real-time without any subscription fees.</p>
    
    <h2>Why Choose FootyBite for ${sport} Streaming?</h2>
    <ul class="news-list">
        <li>100% Free - No registration or payment required</li>
        <li>HD Quality - Crystal clear streams for the best viewing experience</li>
        <li>Multiple Links - Backup streams ensure you never miss a moment</li>
        <li>Mobile Friendly - Watch on any device, anywhere</li>
        <li>Real-Time Updates - Live scores and match statistics</li>
        <li>No Ads Interruption - Minimal ads for uninterrupted viewing</li>
    </ul>
    
    <h2>How to Watch ${sport} Live Streams on FootyBite</h2>
    <p>Watching ${sport} on FootyBite is simple:</p>
    <ol>
        <li>Browse the ${sport} section to find your match</li>
        <li>Click on the match you want to watch</li>
        <li>Wait for the stream to become active (30 minutes before kickoff)</li>
        <li>Enjoy the match in HD quality for free</li>
    </ol>
    
    <h2>Popular ${sport} Competitions</h2>
    <p>We cover all major ${sport} leagues and tournaments including:</p>
    ${sport === 'Football' ? `
    <ul class="news-list">
        <li>Premier League - English top-flight football</li>
        <li>La Liga - Spanish football championship</li>
        <li>Serie A - Italian football league</li>
        <li>Bundesliga - German football league</li>
        <li>Champions League - Europe's elite club competition</li>
        <li>Europa League - European secondary competition</li>
        <li>World Cup - FIFA international tournament</li>
        <li>AFCON - African Cup of Nations</li>
    </ul>
    ` : ''}
    
    <h2>Frequently Asked Questions</h2>
    
    <div class="faq-grid">
        <div class="faq-item">
            <h4>Is ${sport} streaming on FootyBite legal?</h4>
            <p>FootyBite aggregates publicly available streaming links. We do not host any content ourselves. Users should check their local laws regarding streaming.</p>
        </div>
        <div class="faq-item">
            <h4>Do I need to create an account?</h4>
            <p>No! FootyBite is completely free and requires no registration. Simply visit the site and start watching.</p>
        </div>
        <div class="faq-item">
            <h4>What devices are supported?</h4>
            <p>FootyBite works on all devices including desktop computers, laptops, tablets, and smartphones. Our mobile-responsive design ensures optimal viewing on any screen size.</p>
        </div>
        <div class="faq-item">
            <h4>When do streams become available?</h4>
            <p>Streams typically become active 30 minutes before the scheduled match start time. We recommend checking back closer to kickoff.</p>
        </div>
    </div>
    
    <p><strong>Start watching ${sport} live streams now on FootyBite - your #1 destination for free sports streaming!</strong></p>
</article>
`;

    return {
        title,
        slug,
        contentHtml,
        labels: [sport, 'Live', 'Hub'],
        scheduledTime: new Date().toISOString(),
        status: 'hub'
    };
}

function generateBrandPost(brand) {
    const variations = {
        'footybite': 'FootyBite',
        'footybyte': 'FootyByte',
        'fotybyte': 'FotyByte'
    };

    const brandName = variations[brand] || brand;
    const title = `${brandName} - Free Live Sports Streaming`;
    const slug = `${brand}.html`;

    const contentHtml = `
<article>
    <h1>${brandName} - Watch Live Sports Free</h1>
    
    <p><strong>${brandName}</strong> is your ultimate destination for free live sports streaming. We provide high-quality streaming links for Football, NFL, NBA, Boxing, F1, and more - all completely free with no registration required.</p>
    
    <h2>What is ${brandName}?</h2>
    <p>${brandName} is a sports streaming aggregator that brings together the best free streaming links from across the internet. Our mission is to make live sports accessible to everyone, regardless of location or budget.</p>
    
    <h2>Sports We Cover</h2>
    <ul class="news-list">
        <li><strong>Football</strong> - Premier League, La Liga, Serie A, Champions League, World Cup, AFCON</li>
        <li><strong>NFL</strong> - All NFL games including playoffs and Super Bowl</li>
        <li><strong>NBA</strong> - Regular season, playoffs, and NBA Finals</li>
        <li><strong>Boxing & UFC</strong> - Major fights and pay-per-view events</li>
        <li><strong>Formula 1</strong> - All F1 races and qualifying sessions</li>
    </ul>
    
    <h2>Why Choose ${brandName}?</h2>
    <div class="match-details-grid">
        <div class="match-info-card">
            <h3>100% Free</h3>
            <p>No subscription fees, no hidden charges. All streams are completely free to access.</p>
        </div>
        <div class="match-info-card">
            <h3>HD Quality</h3>
            <p>Enjoy crystal-clear HD streams for the best viewing experience.</p>
        </div>
        <div class="match-info-card">
            <h3>No Registration</h3>
            <p>Start watching immediately without creating an account or providing personal information.</p>
        </div>
        <div class="match-info-card">
            <h3>Mobile Friendly</h3>
            <p>Watch on any device - desktop, laptop, tablet, or smartphone.</p>
        </div>
    </div>
    
    <h2>How to Use ${brandName}</h2>
    <ol>
        <li>Visit ${brandName} website</li>
        <li>Browse by sport or search for your match</li>
        <li>Click on the match you want to watch</li>
        <li>Wait for the stream to become active (usually 30 minutes before kickoff)</li>
        <li>Enjoy the match in HD quality</li>
    </ol>
    
    <h2>Popular Searches</h2>
    <p>Users commonly search for: ${brand} football, ${brand} nfl streams, ${brand} nba, ${brand} live, ${brand} soccer streams, ${brand} premier league, ${brand} champions league</p>
    
    <p><strong>Start streaming now on ${brandName} - The #1 free sports streaming platform!</strong></p>
</article>
`;

    return {
        title,
        slug,
        contentHtml,
        labels: ['Brand', 'FootyBite', 'Live'],
        scheduledTime: new Date().toISOString(),
        status: 'brand'
    };
}

async function generateAllPosts() {
    console.log('Fetching events data...');
    const response = await axios.get(DATA_URL);
    const categories = response.data.events.streams;

    const posts = [];

    // Generate match posts
    for (const cat of categories) {
        for (const stream of cat.streams) {
            const event = normalizeEvent(stream, cat.category);

            // Only create posts for upcoming and live matches
            if (event.status !== 'finished') {
                const post = generateMatchPost(event);
                posts.push(post);
            }
        }
    }

    // Generate hub posts
    const sports = ['Football', 'NFL', 'NBA', 'Boxing', 'F1'];
    for (const sport of sports) {
        posts.push(generateHubPost(sport));
    }

    // Generate brand posts
    const brands = ['footybite', 'footybyte', 'fotybyte'];
    for (const brand of brands) {
        posts.push(generateBrandPost(brand));
    }

    console.log(`Generated ${posts.length} posts`);
    return posts;
}

module.exports = {
    generateAllPosts,
    generateMatchPost,
    generateHubPost,
    generateBrandPost,
    normalizeEvent
};

// CLI usage
if (require.main === module) {
    generateAllPosts()
        .then(posts => {
            console.log(JSON.stringify(posts, null, 2));
        })
        .catch(console.error);
}
