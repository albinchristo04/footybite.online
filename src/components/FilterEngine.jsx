import React, { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard';

export default function FilterEngine({ initialEvents, initialSport = 'all', isHomepage = false }) {
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedLeague, setSelectedLeague] = useState('all');

    // 2️⃣ DATE FILTER: Rehydrate from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const date = params.get('date');
        const league = params.get('league');
        if (date) setSelectedDate(date);
        if (league) setSelectedLeague(league);
    }, []);

    // 2️⃣ DATE FILTER: Update URL
    useEffect(() => {
        if (isHomepage) return;
        const url = new URL(window.location);
        if (selectedDate !== 'today') url.searchParams.set('date', selectedDate);
        else url.searchParams.delete('date');

        if (selectedLeague !== 'all') url.searchParams.set('league', selectedLeague);
        else url.searchParams.delete('league');

        window.history.pushState({}, '', url);
    }, [selectedDate, selectedLeague, isHomepage]);

    const leagues = useMemo(() => {
        const filtered = initialEvents.filter(e => e.sport === initialSport || initialSport === 'all');
        const uniqueLeagues = [...new Set(filtered.map(e => e.league).filter(Boolean))];
        return uniqueLeagues.sort();
    }, [initialEvents, initialSport]);

    // 3️⃣ UPCOMING MATCHES (GLOBAL SECTION)
    const upcoming3h = useMemo(() => {
        const now = Date.now();
        const threeHours = 3 * 60 * 60 * 1000;
        return initialEvents.filter(event => {
            return event.status === 'upcoming' &&
                event.startTime > now &&
                event.startTime <= now + threeHours;
        }).sort((a, b) => {
            // Sorted by: Live soonest, then Popularity score
            if (a.startTime !== b.startTime) return a.startTime - b.startTime;
            return b.popularityScore - a.popularityScore;
        });
    }, [initialEvents]);

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            // Sport Filter
            if (initialSport !== 'all' && event.sport !== initialSport) return false;

            // 2️⃣ DATE FILTER: TODAY / TOMORROW (STRICT)
            const eventDate = new Date(event.startTime);
            const now = new Date();

            const today = new Date(now);
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const eventDay = new Date(eventDate);
            eventDay.setHours(0, 0, 0, 0);

            if (selectedDate === 'today') {
                if (eventDay.getTime() !== today.getTime()) return false;
            } else if (selectedDate === 'tomorrow') {
                if (eventDay.getTime() !== tomorrow.getTime()) return false;
            }

            // League Filter
            if (selectedLeague !== 'all' && event.league !== selectedLeague) return false;

            // 4️⃣ Finished matches NEVER shown
            if (event.status === 'finished') return false;

            return true;
        }).sort((a, b) => {
            // 5️⃣ POPULARITY SORT (MANDATORY)
            if (b.popularityScore !== a.popularityScore) return b.popularityScore - a.popularityScore;
            return a.startTime - b.startTime;
        });
    }, [initialEvents, initialSport, selectedDate, selectedLeague]);

    const sections = useMemo(() => {
        const result = [];

        // 3️⃣ UPCOMING MATCHES (GLOBAL SECTION)
        if (upcoming3h.length > 0) {
            result.push({ title: '⏱️ Upcoming (Next 3 Hours)', events: upcoming3h });
        }

        if (!isHomepage) {
            // Category Page Layout
            const live = filteredEvents.filter(e => e.status === 'live');
            const upcoming = filteredEvents.filter(e => e.status === 'upcoming');

            if (live.length > 0) result.push({ title: `🔴 Live ${initialSport.charAt(0).toUpperCase() + initialSport.slice(1)} Matches`, events: live });
            if (upcoming.length > 0) result.push({ title: `⏱️ Upcoming ${initialSport.charAt(0).toUpperCase() + initialSport.slice(1)}`, events: upcoming });
        } else {
            // Homepage Layout
            const live = initialEvents.filter(e => e.status === 'live').sort((a, b) => b.popularityScore - a.popularityScore);
            if (live.length > 0) result.push({ title: '🔴 LIVE NOW', events: live });

            // 4️⃣ CATEGORY SECTIONS (ORDER ENFORCED)
            const sports = [
                { id: 'football', name: 'Football', icon: '⚽' },
                { id: 'motorsports', name: 'Motorsports', icon: '🏎️' },
                { id: 'basketball', name: 'Basketball', icon: '🏀' },
                { id: 'nfl', name: 'NFL', icon: '🏈' },
                { id: 'boxing', name: 'Boxing', icon: '🥊' }
            ];

            sports.forEach(s => {
                const sportEvents = initialEvents.filter(e => e.sport === s.id && e.status !== 'finished')
                    .sort((a, b) => {
                        if (b.popularityScore !== a.popularityScore) return b.popularityScore - a.popularityScore;
                        return a.startTime - b.startTime;
                    });
                if (sportEvents.length > 0) {
                    result.push({ title: `${s.icon} ${s.name}`, events: sportEvents });
                }
            });
        }

        return result;
    }, [filteredEvents, initialEvents, isHomepage, upcoming3h, initialSport]);

    return (
        <div className="container">
            {!isHomepage && (
                <div className="sticky-filters">
                    <div className="filters-container">
                        <div className="date-tabs">
                            <div className={`date-tab ${selectedDate === 'today' ? 'active' : ''}`} onClick={() => setSelectedDate('today')}>🔴 Today</div>
                            <div className={`date-tab ${selectedDate === 'tomorrow' ? 'active' : ''}`} onClick={() => setSelectedDate('tomorrow')}>Tomorrow</div>
                        </div>
                        {leagues.length > 0 && (
                            <div className="league-chips">
                                <div className={`league-chip ${selectedLeague === 'all' ? 'active' : ''}`} onClick={() => setSelectedLeague('all')}>All Leagues</div>
                                {leagues.map(l => (
                                    <div key={l} className={`league-chip ${selectedLeague === l ? 'active' : ''}`} onClick={() => setSelectedLeague(l)}>{l}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="sections-container">
                {sections.map(section => (
                    <div key={section.title} className="match-section">
                        <h2 className="section-title">{section.title}</h2>
                        <div className="match-grid">
                            {section.events.map(event => (
                                <MatchCard key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                ))}
                {sections.length === 0 && (
                    <div className="empty-state">
                        <h3>No matches found</h3>
                        <p>Try adjusting your filters or checking back later.</p>
                        <button className="reset-btn" onClick={() => { setSelectedDate('today'); setSelectedLeague('all'); }}>Reset All Filters</button>
                    </div>
                )}
            </div>
        </div>
    );
}
