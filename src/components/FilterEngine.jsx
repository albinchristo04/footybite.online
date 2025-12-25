import React, { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard';

export default function FilterEngine({ initialEvents, initialSport = 'all' }) {
    const [selectedSport, setSelectedSport] = useState(initialSport);
    const [selectedDate, setSelectedDate] = useState('today');
    const [selectedLeague, setSelectedLeague] = useState('all');

    // Sync with URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sport = params.get('sport');
        const league = params.get('league');
        if (sport) setSelectedSport(sport);
        if (league) setSelectedLeague(league);
    }, []);

    // Update URL when filters change
    useEffect(() => {
        const url = new URL(window.location);
        if (selectedSport !== 'all') url.searchParams.set('sport', selectedSport);
        else url.searchParams.delete('sport');

        if (selectedLeague !== 'all') url.searchParams.set('league', selectedLeague);
        else url.searchParams.delete('league');

        window.history.pushState({}, '', url);
    }, [selectedSport, selectedLeague]);

    const leagues = useMemo(() => {
        const filtered = selectedSport === 'all'
            ? initialEvents
            : initialEvents.filter(e => e.catSlug === selectedSport);
        const uniqueLeagues = [...new Set(filtered.map(e => e.tag).filter(Boolean))];
        return uniqueLeagues.sort();
    }, [selectedSport, initialEvents]);

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            // Sport Filter
            if (selectedSport !== 'all' && event.catSlug !== selectedSport) return false;

            // League Filter
            if (selectedLeague !== 'all' && event.tag !== selectedLeague) return false;

            // Date Filter
            const eventDate = new Date(event.starts_at * 1000);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const eventDay = new Date(eventDate);
            eventDay.setHours(0, 0, 0, 0);

            if (selectedDate === 'today') {
                return eventDay.getTime() === today.getTime();
            } else if (selectedDate === 'tomorrow') {
                return eventDay.getTime() === tomorrow.getTime();
            } else if (selectedDate === 'week') {
                return eventDay >= today && eventDay <= nextWeek;
            }

            return true;
        });
    }, [selectedSport, selectedDate, selectedLeague, initialEvents]);

    const sports = [
        { id: 'all', name: 'All Sports' },
        { id: 'soccer', name: 'Soccer' },
        { id: 'basketball', name: 'NBA' },
        { id: 'american-football', name: 'NFL' },
        { id: 'fighting', name: 'Boxing/UFC' },
        { id: 'formula-1', name: 'Formula 1' }
    ];

    return (
        <div className="container">
            <div className="filters-container">
                <div className="tabs">
                    <div
                        className={`tab ${selectedDate === 'today' ? 'active' : ''}`}
                        onClick={() => setSelectedDate('today')}
                    >Today</div>
                    <div
                        className={`tab ${selectedDate === 'tomorrow' ? 'active' : ''}`}
                        onClick={() => setSelectedDate('tomorrow')}
                    >Tomorrow</div>
                    <div
                        className={`tab ${selectedDate === 'week' ? 'active' : ''}`}
                        onClick={() => setSelectedDate('week')}
                    >This Week</div>
                </div>

                <div className="filter-row">
                    <div className="select-wrapper">
                        <select
                            value={selectedSport}
                            onChange={(e) => {
                                setSelectedSport(e.target.value);
                                setSelectedLeague('all');
                            }}
                        >
                            {sports.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {leagues.length > 0 && (
                        <div className="select-wrapper">
                            <select
                                value={selectedLeague}
                                onChange={(e) => setSelectedLeague(e.target.value)}
                            >
                                <option value="all">All Leagues</option>
                                {leagues.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="match-grid">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <MatchCard key={event.id} event={event} />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem', color: 'var(--gray)' }}>
                        No matches found for the selected filters.
                    </div>
                )}
            </div>
        </div>
    );
}
