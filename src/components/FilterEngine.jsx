import React, { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard';

export default function FilterEngine({ initialEvents, initialSport = 'all', isHomepage = false }) {
    const [selectedSport, setSelectedSport] = useState(initialSport);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedLeague, setSelectedLeague] = useState('all');

    // Sync with URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const date = params.get('date');
        const league = params.get('league');
        if (date) setSelectedDate(date);
        if (league) setSelectedLeague(league);
    }, []);

    // Update URL when filters change
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

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            // 1. Sport Filter (already handled by initialEvents for category pages)
            if (initialSport !== 'all' && event.sport !== initialSport) return false;

            // 2. Date Filter
            const eventDate = new Date(event.startTime);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const eventDay = new Date(eventDate);
            eventDay.setHours(0, 0, 0, 0);

            if (selectedDate === 'today') {
                if (eventDay.getTime() !== today.getTime()) return false;
            } else if (selectedDate === 'tomorrow') {
                if (eventDay.getTime() !== tomorrow.getTime()) return false;
            } else if (selectedDate === 'week') {
                if (eventDay < today || eventDay > nextWeek) return false;
            }

            // 3. League Filter
            if (selectedLeague !== 'all' && event.league !== selectedLeague) return false;

            // 4. No finished matches
            if (event.status === 'finished') return false;

            return true;
        }).sort((a, b) => b.popularityScore - a.popularityScore);
    }, [initialEvents, initialSport, selectedDate, selectedLeague]);

    const sections = useMemo(() => {
        if (!isHomepage) {
            // Category Page Layout
            const popular = filteredEvents.filter(e => e.popularityScore >= 50);
            const live = filteredEvents.filter(e => e.status === 'live');
            const upcomingToday = filteredEvents.filter(e => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const eventDay = new Date(e.startTime);
                eventDay.setHours(0, 0, 0, 0);
                return e.status === 'upcoming' && eventDay.getTime() === today.getTime();
            });
            const tomorrowSection = filteredEvents.filter(e => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const eventDay = new Date(e.startTime);
                eventDay.setHours(0, 0, 0, 0);
                return eventDay.getTime() === tomorrow.getTime();
            });

            const result = [];
            if (popular.length > 0) result.push({ title: '🔥 Popular Matches', events: popular });
            if (live.length > 0) result.push({ title: '🔴 Live Football Matches', events: live });
            if (upcomingToday.length > 0) result.push({ title: '⏱️ Upcoming Today', events: upcomingToday });
            if (tomorrowSection.length > 0) result.push({ title: '📅 Tomorrow', events: tomorrowSection });

            // If no sections matched but we have events (e.g. "This Week" filter), show them all
            if (result.length === 0 && filteredEvents.length > 0) {
                result.push({ title: 'Matches', events: filteredEvents });
            }

            return result;
        }

        // Homepage Logic: Group by Status then Sport
        const live = initialEvents.filter(e => e.status === 'live');
        const upcoming = initialEvents.filter(e => e.status === 'upcoming' && (e.startTime - Date.now()) < 24 * 60 * 60 * 1000);

        const sports = [
            { id: 'football', name: 'Football', icon: '⚽' },
            { id: 'nfl', name: 'NFL', icon: '🏈' },
            { id: 'nba', name: 'NBA', icon: '🏀' },
            { id: 'boxing', name: 'Boxing / UFC', icon: '🥊' },
            { id: 'f1', name: 'Formula 1', icon: '🏎️' }
        ];

        const sportSections = sports.map(s => ({
            title: `${s.icon} ${s.name}`,
            events: initialEvents.filter(e => e.sport === s.id && e.status !== 'finished').sort((a, b) => b.popularityScore - a.popularityScore)
        }));

        return [
            { title: '🔴 LIVE NOW', events: live.sort((a, b) => b.popularityScore - a.popularityScore) },
            { title: '⏱️ UPCOMING (Next 24h)', events: upcoming.sort((a, b) => b.popularityScore - a.popularityScore) },
            ...sportSections
        ];
    }, [filteredEvents, initialEvents, isHomepage]);

    return (
        <div className="container">
            {!isHomepage && (
                <div className="sticky-filters">
                    <div className="filters-container">
                        <div className="date-tabs">
                            <div className={`date-tab ${selectedDate === 'today' ? 'active' : ''}`} onClick={() => setSelectedDate('today')}>🔴 Today</div>
                            <div className={`date-tab ${selectedDate === 'tomorrow' ? 'active' : ''}`} onClick={() => setSelectedDate('tomorrow')}>Tomorrow</div>
                            <div className={`date-tab ${selectedDate === 'week' ? 'active' : ''}`} onClick={() => setSelectedDate('week')}>This Week</div>
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
                    section.events.length > 0 && (
                        <div key={section.title} className="match-section">
                            <h2 className="section-title">{section.title}</h2>
                            <div className="match-grid">
                                {section.events.map(event => (
                                    <MatchCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    )
                ))}
                {sections.every(s => s.events.length === 0) && (
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
