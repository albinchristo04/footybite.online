import React, { useState, useMemo, useCallback } from 'react';

export default function SearchBar({ events, onSearchResults, onClear }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Create searchable index from events
    const searchableIndex = useMemo(() => {
        const index = new Map();
        
        events.forEach(event => {
            // Add team names
            if (event.teams) {
                event.teams.forEach(team => {
                    const key = team.toLowerCase();
                    if (!index.has(key)) {
                        index.set(key, new Set());
                    }
                    index.get(key).add(event.id);
                });
            }
            
            // Add league name
            if (event.league) {
                const key = event.league.toLowerCase();
                if (!index.has(key)) {
                    index.set(key, new Set());
                }
                index.get(key).add(event.id);
            }
            
            // Add sport name
            if (event.sport) {
                const key = event.sport.toLowerCase();
                if (!index.has(key)) {
                    index.set(key, new Set());
                }
                index.get(key).add(event.id);
            }
        });
        
        return index;
    }, [events]);

    // Perform search
    const performSearch = useCallback((query) => {
        if (!query.trim()) {
            onClear?.();
            return;
        }

        const queryLower = query.toLowerCase().trim();
        const matchingEventIds = new Set();
        
        // Search in index
        for (const [key, eventIds] of searchableIndex) {
            if (key.includes(queryLower)) {
                eventIds.forEach(id => matchingEventIds.add(id));
            }
        }
        
        // Convert back to events
        const matchingEvents = events.filter(event => matchingEventIds.has(event.id));
        
        // Sort by relevance (live first, then upcoming, then by popularity)
        matchingEvents.sort((a, b) => {
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (a.status !== 'live' && b.status === 'live') return 1;
            if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
            if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
            return b.popularityScore - a.popularityScore;
        });
        
        onSearchResults?.(matchingEvents, query);
    }, [events, searchableIndex, onSearchResults, onClear]);

    // Handle input change
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setIsSearching(true);
        
        // Debounce search
        const timeoutId = setTimeout(() => {
            performSearch(value);
            setIsSearching(false);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    };

    // Handle clear
    const handleClear = () => {
        setSearchQuery('');
        onClear?.();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            handleClear();
        }
    };

    return (
        <div className="search-bar">
            <div className="search-container">
                <div className="search-input-wrapper">
                    <svg 
                        className="search-icon" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Search teams, leagues, or sports..."
                        className="search-input"
                        aria-label="Search matches"
                    />
                    {searchQuery && (
                        <button 
                            onClick={handleClear}
                            className="search-clear-btn"
                            aria-label="Clear search"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
                {isSearching && (
                    <div className="search-loading">
                        <div className="search-spinner"></div>
                    </div>
                )}
            </div>
        </div>
    );
}