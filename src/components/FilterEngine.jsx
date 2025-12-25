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
        const date = params.get('date');
        if (sport) setSelectedSport(sport);
        if (league) setSelectedLeague(league);
        if (date) setSelectedDate(date);

        // Listen for custom events from hero buttons
        const handleHeroFilter = (e) => {
            if (e.detail.sport) {
                setSelectedSport(e.detail.sport);
                setSelectedLeague('all');
            }
        };
        window.addEventListener('heroFilter', handleHeroFilter);
        return () => window.removeEventListener('heroFilter', handleHeroFilter);
    }, []);

    // Update URL when filters change
    useEffect(() => {
        const url = new URL(window.location);
        if (selectedSport !== 'all') url.searchParams.set('sport', selectedSport);
        else url.searchParams.delete('sport');

        if (selectedLeague !== 'all') url.searchParams.set('league', selectedLeague);
        else url.searchParams.delete('league');

        if (selectedDate !== 'today') url.searchParams.set('date', selectedDate);
        else url.searchParams.delete('date');

        window.history.pushState({}, '', url);
    }, [selectedSport, selectedLeague, selectedDate]);

    const leagues = useMemo(() => {
        const filtered = selectedSport === 'all'
            ? initialEvents
            : initialEvents.filter(e => e.catSlug === selectedSport);

        const uniqueLeagues = [];
        const seenLeagues = new Set();

        filtered.forEach(e => {
            if (e.tag && !seenLeagues.has(e.tag)) {
                seenLeagues.add(e.tag);
                uniqueLeagues.push({
                    name: e.tag,
                    logo: e.poster // Using poster as a proxy for league logo if available
                });
            }
        });

        return uniqueLeagues.sort((a, b) => a.name.localeCompare(b.name));
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

    const resetFilters = () => {
        setSelectedSport('all');
        setSelectedDate('today');
        setSelectedLeague('all');
    };

    return (
        <div className="container">
            <div className="sticky-filters">
                <div className="filters-container">
                    {/* Date Tabs */}
                    <div className="date-tabs">
                        <div
                            className={`date-tab ${selectedDate === 'today' ? 'active' : ''}`}
                            onClick={() => setSelectedDate('today')}
                        >🔴 Today</div>
                        <div
                            className={`date-tab ${selectedDate === 'tomorrow' ? 'active' : ''}`}
                            onClick={() => setSelectedDate('tomorrow')}
                        >Tomorrow</div>
                        <div
                            className={`date-tab ${selectedDate === 'week' ? 'active' : ''}`}
                            onClick={() => setSelectedDate('week')}
                        >This Week</div>
                    </div>

                    {/* League Chips - Only show if sport is selected or if we want them always visible */}
                    {leagues.length > 0 && (
                        <div className="league-chips">
                            <div
                                className={`league-chip ${selectedLeague === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedLeague('all')}
                            >All Leagues</div>
                            {leagues.map(league => (
                                <div
                                    key={league.name}
                                    className={`league-chip ${selectedLeague === league.name ? 'active' : ''}`}
                                    onClick={() => setSelectedLeague(league.name)}
                                >
                                    {league.name}
                                </div>
                            ))}
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
                    <div className="empty-state">
                        <h3>No matches found</h3>
                        <p>No matches found for <strong>{selectedSport === 'all' ? 'All Sports' : selectedSport}</strong> · <strong>{selectedDate}</strong></p>
                        <button className="reset-btn" onClick={resetFilters}>Reset All Filters</button>
                    </div>
                )}
            </div>
        </div>
    );
}
