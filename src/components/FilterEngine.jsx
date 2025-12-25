import React, { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard';

export default function FilterEngine({ initialEvents, initialSport = 'all', isHomepage = false }) {
    const [selectedSport, setSelectedSport] = useState(initialSport);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedLeague, setSelectedLeague] = useState('all');

    // Sync with URL on mount (only for category pages)
    useEffect(() => {
        if (isHomepage) return;
        const params = new URLSearchParams(window.location.search);
        const sport = params.get('sport');
        const league = params.get('league');
        const date = params.get('date');
        if (sport) setSelectedSport(sport);
        if (league) setSelectedLeague(league);
        if (date) setSelectedDate(date);
    }, [isHomepage]);

    // Update URL when filters change (only for category pages)
    useEffect(() => {
        if (isHomepage) return;
        const url = new URL(window.location);
        if (selectedSport !== 'all') url.searchParams.set('sport', selectedSport);
        else url.searchParams.delete('sport');

        if (selectedLeague !== 'all') url.searchParams.set('league', selectedLeague);
        else url.searchParams.delete('league');

        if (selectedDate !== 'today') url.searchParams.set('date', selectedDate);
        else url.searchParams.delete('date');

        window.history.pushState({}, '', url);
    }, [selectedSport, selectedLeague, selectedDate, isHomepage]);

    const leagues = useMemo(() => {
        if (isHomepage) return [];
        const filtered = selectedSport === 'all'
            ? initialEvents
            : initialEvents.filter(e => e.sport === selectedSport);

        const uniqueLeagues = [...new Set(filtered.map(e => e.league).filter(Boolean))];
        return uniqueLeagues.sort();
    }, [selectedSport, initialEvents, isHomepage]);

    const sections = useMemo(() => {
        if (!isHomepage) {
            const filtered = initialEvents.filter(event => {
                if (selectedSport !== 'all' && event.sport !== selectedSport) return false;
                if (selectedLeague !== 'all' && event.league !== selectedLeague) return false;

                const eventDate = new Date(event.startTime);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);

                const eventDay = new Date(eventDate);
                eventDay.setHours(0, 0, 0, 0);

                if (selectedDate === 'today') return eventDay.getTime() === today.getTime();
                if (selectedDate === 'tomorrow') return eventDay.getTime() === tomorrow.getTime();
                if (selectedDate === 'week') return eventDay >= today && eventDay <= nextWeek;
                return true;
            });
            return [{ title: 'Matches', events: filtered }];
        }

        // Homepage Logic: Group by Status then Sport
        const live = initialEvents.filter(e => e.status === 'live');
        const upcoming = initialEvents.filter(e => e.status === 'upcoming' && (e.startTime - Date.now()) < 24 * 60 * 60 * 1000);

        const sports = [
            { id: 'soccer', name: 'Soccer', icon: '⚽' },
            { id: 'nfl', name: 'NFL', icon: '🏈' },
            { id: 'nba', name: 'NBA', icon: '🏀' },
            { id: 'boxing', name: 'Boxing / UFC', icon: '🥊' },
            { id: 'f1', name: 'Formula 1', icon: '🏎️' }
        ];

        const sportSections = sports.map(s => ({
            title: `${s.icon} ${s.name}`,
            events: initialEvents.filter(e => e.sport === s.id && e.status !== 'finished')
        }));

        return [
            { title: '🔴 LIVE NOW', events: live },
            { title: '⏱️ UPCOMING (Next 24h)', events: upcoming },
            ...sportSections
        ];
    }, [initialEvents, isHomepage, selectedSport, selectedDate, selectedLeague]);

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
                    <div key={section.title} className="match-section">
                        <h2 className="section-title">{section.title}</h2>
                        <div className="match-grid">
                            {section.events.length > 0 ? (
                                section.events.map(event => (
                                    <MatchCard key={event.id} event={event} />
                                ))
                            ) : (
                                <div className="empty-state-small">
                                    <p>No {section.title.toLowerCase()} right now</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
