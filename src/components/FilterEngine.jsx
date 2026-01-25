import React, { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard';
import EnhancedMatchCard from './EnhancedMatchCard';
import SearchBar from './SearchBar';
import { CardSkeleton } from './SkeletonLoader';

export default function FilterEngine({ initialEvents, initialSport = 'all', isHomepage = false, initialDate = 'today' }) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedLeague, setSelectedLeague] = useState('all');
    const [searchResults, setSearchResults] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        if (selectedDate !== initialDate) url.searchParams.set('date', selectedDate);
        else url.searchParams.delete('date');

        if (selectedLeague !== 'all') url.searchParams.set('league', selectedLeague);
        else url.searchParams.delete('league');

        window.history.pushState({}, '', url);
    }, [selectedDate, selectedLeague, isHomepage, initialDate]);

    const leagues = useMemo(() => {
        const filtered = initialEvents.filter(e => e.sport === initialSport || initialSport === 'all');
        const uniqueLeagues = [...new Set(filtered.map(e => e.league).filter(Boolean))];
        return uniqueLeagues.sort();
    }, [initialEvents, initialSport]);

    const upcoming3h = useMemo(() => {
        const now = Date.now();
        const threeHours = 3 * 60 * 60 * 1000;
        return initialEvents.filter(event => {
            return event.status === 'upcoming' &&
                event.startTime > now &&
                event.startTime <= now + threeHours;
        }).sort((a, b) => {
            if (a.startTime !== b.startTime) return a.startTime - b.startTime;
            return b.popularityScore - a.popularityScore;
        });
    }, [initialEvents]);

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(event => {
            if (initialSport !== 'all' && event.sport !== initialSport) return false;

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

            if (selectedLeague !== 'all' && event.league !== selectedLeague) return false;
            if (event.status === 'finished') return false;

            return true;
        }).sort((a, b) => {
            if (a.startTime !== b.startTime) return a.startTime - b.startTime;
            return b.popularityScore - a.popularityScore;
        });
    }, [initialEvents, initialSport, selectedDate, selectedLeague]);

const sections = useMemo(() => {
        const result = [];
        
        // If we have search results, show only those
        if (searchResults) {
            if (searchResults.length > 0) {
                result.push({ 
                    title: `🔍 Search Results for "${searchQuery}"`, 
                    events: searchResults,
                    isSearch: true
                });
            }
            return result;
        }
        
        // Regular sections
        if (upcoming3h.length > 0) result.push({ title: '⏱️ Upcoming (Next 3 Hours)', events: upcoming3h });

        if (!isHomepage) {
            const live = filteredEvents.filter(e => e.status === 'live');
            const upcoming = filteredEvents.filter(e => e.status === 'upcoming');
            if (live.length > 0) result.push({ title: `🔴 Live ${initialSport.charAt(0).toUpperCase() + initialSport.slice(1)} Matches`, events: live });
            if (upcoming.length > 0) result.push({ title: `⏱️ Upcoming ${initialSport.charAt(0).toUpperCase() + initialSport.slice(1)}`, events: upcoming });
        } else {
            const live = initialEvents.filter(e => e.status === 'live').sort((a, b) => b.popularityScore - a.popularityScore);
            if (live.length > 0) result.push({ title: '🔴 LIVE NOW', events: live });

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
                        if (a.startTime !== b.startTime) return a.startTime - b.startTime;
                        return b.popularityScore - a.popularityScore;
                    });
                if (sportEvents.length > 0) result.push({ title: `${s.icon} ${s.name}`, events: sportEvents });
            });
        }
        return result;
    }, [filteredEvents, initialEvents, isHomepage, upcoming3h, initialSport, searchResults, searchQuery]);

// Handle search results
    const handleSearchResults = (results, query) => {
        setSearchResults(results);
        setSearchQuery(query);
        setIsLoading(false);
    };

    // Handle search clear
    const handleSearchClear = () => {
        setSearchResults(null);
        setSearchQuery('');
    };

    // Use enhanced match card for live matches
    const renderMatchCard = (event, showLiveScore = false) => {
        if (event.status === 'live' || showLiveScore) {
            return <EnhancedMatchCard key={event.id} event={event} showLiveScore={true} />;
        }
        return <MatchCard key={event.id} event={event} />;
    };

    return (
        <div className="container">
            {/* Search Bar - Always visible */}
            <div className="search-section">
                <SearchBar 
                    events={initialEvents} 
                    onSearchResults={handleSearchResults}
                    onClear={handleSearchClear}
                />
            </div>

            {!isHomepage && !searchResults && (
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
                {isLoading ? (
                    <div className="match-grid">
                        {Array.from({ length: 6 }, (_, index) => (
                            <CardSkeleton key={index} />
                        ))}
                    </div>
                ) : (
                    sections.map(section => (
                        <div key={section.title} className="match-section">
                            <h2 className="section-title">
                                {section.title}
                                {section.isSearch && (
                                    <span className="search-count">({section.events.length} results)</span>
                                )}
                            </h2>
                            <div className="match-grid">
                                {section.events.map(event => renderMatchCard(event, section.isSearch))}
                            </div>
                        </div>
                    ))
                )}
                
                {!isLoading && sections.length === 0 && (
                    <div className="empty-state">
                        <h3>No matches found</h3>
                        <p>{searchResults ? 'Try different search terms.' : 'Try adjusting your filters or checking back later.'}</p>
                        <button 
                            className="reset-btn" 
                            onClick={() => { 
                                setSelectedDate('today'); 
                                setSelectedLeague('all'); 
                                handleSearchClear();
                            }}
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
