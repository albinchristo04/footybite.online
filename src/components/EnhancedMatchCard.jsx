import React, { useState, useEffect } from 'react';
import Countdown from './Countdown';
import { CardSkeleton } from './SkeletonLoader';

const FALLBACK_IMAGES = {
    'football': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'nba': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    'nfl': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop',
    'boxing': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop',
    'f1': 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=800&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop'
};

export default function EnhancedMatchCard({ event, showLiveScore = false }) {
    const [isLoading, setIsLoading] = useState(true);
    const [liveScore, setLiveScore] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageError, setImageError] = useState(false);

    const { id, sport, league, teams, startTime, status, thumbnail, url, popularityScore } = event;

    // Simulate live score updates
    useEffect(() => {
        if (showLiveScore && status === 'live') {
            const interval = setInterval(() => {
                // Simulate score changes (in real app, this would come from API)
                setLiveScore({
                    homeScore: Math.floor(Math.random() * 3),
                    awayScore: Math.floor(Math.random() * 3),
                    minute: Math.floor(Math.random() * 90) + 1
                });
            }, 30000); // Update every 30 seconds

            return () => clearInterval(interval);
        }
    }, [showLiveScore, status]);

    // Handle image load
    const handleImageLoad = () => {
        setIsLoading(false);
    };

    // Handle image error
    const handleImageError = () => {
        setImageError(true);
        setIsLoading(false);
    };

    // Handle favorite toggle
    const handleFavoriteToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFavorite(!isFavorite);
        
        // Save to localStorage (in real app, this would sync with backend)
        const favorites = JSON.parse(localStorage.getItem('favoriteMatches') || '[]');
        if (isFavorite) {
            const updatedFavorites = favorites.filter(favId => favId !== id);
            localStorage.setItem('favoriteMatches', JSON.stringify(updatedFavorites));
        } else {
            favorites.push(id);
            localStorage.setItem('favoriteMatches', JSON.stringify(favorites));
        }
    };

    // Check if match is favorite on mount
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favoriteMatches') || '[]');
        setIsFavorite(favorites.includes(id));
    }, [id]);

    // Get appropriate image source
    const getImageSource = () => {
        if (imageError || !thumbnail) {
            return FALLBACK_IMAGES[sport] || FALLBACK_IMAGES.default;
        }
        return thumbnail;
    };

    // Render loading skeleton
    if (isLoading && !imageError) {
        return <CardSkeleton />;
    }

    return (
        <a href={`/${url}`} className="enhanced-match-card" data-match-id={id}>
            <div className="match-card-header">
                <div className="match-card-actions">
                    <button 
                        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                        onClick={handleFavoriteToggle}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    {popularityScore > 150 && (
                        <div className="popularity-badge" title="High popularity match">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            <div className="match-thumb-wrapper">
                <div className="league-badge">{league}</div>
                {status === 'live' && (
                    <div className="live-indicator-top">
                        <span className="live-dot"></span>
                        <span>LIVE</span>
                    </div>
                )}
                <img
                    src={getImageSource()}
                    alt={teams && teams.length > 0 ? `${teams.join(' vs ')} live stream thumbnail` : 'Live sports stream thumbnail'}
                    loading="lazy"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            </div>

            <div className="match-card-content">
                <div className="match-date-small">
                    {new Date(startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="match-teams">
                    {teams.map((team, idx) => (
                        <div key={idx} className="team-row">
                            <span className="team-name">{team}</span>
                            {showLiveScore && status === 'live' && liveScore && (
                                <span className="team-score">
                                    {idx === 0 ? liveScore.homeScore : liveScore.awayScore}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Live score display */}
                {showLiveScore && status === 'live' && liveScore && (
                    <div className="live-score-info">
                        <div className="current-score">
                            {liveScore.homeScore} - {liveScore.awayScore}
                        </div>
                        <div className="match-minute">
                            {liveScore.minute}'
                        </div>
                    </div>
                )}

                <div className="match-card-footer">
                    <Countdown startTime={startTime} />
                    <div className="match-status-indicator">
                        {status === 'live' && (
                            <span className="status-badge live">LIVE</span>
                        )}
                        {status === 'upcoming' && (
                            <span className="status-badge upcoming">UPCOMING</span>
                        )}
                    </div>
                </div>
            </div>
        </a>
    );
}