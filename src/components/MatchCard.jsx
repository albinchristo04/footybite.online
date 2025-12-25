import React from 'react';
import Countdown from './Countdown';

const FALLBACK_IMAGES = {
    'football': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'nba': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    'nfl': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop',
    'boxing': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop',
    'f1': 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=800&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop'
};

export default function MatchCard({ event }) {
    const { id, sport, league, teams, startTime, status, thumbnail, url } = event;

    const thumb = thumbnail || FALLBACK_IMAGES[sport] || FALLBACK_IMAGES.default;

    return (
        <a href={`/${url}`} className="match-card">
            <div className="match-thumb-wrapper">
                <div className="league-badge">{league}</div>
                <img
                    src={thumb}
                    alt={`${teams.join(' vs ')} live stream thumbnail`}
                    loading="lazy"
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
                        </div>
                    ))}
                </div>

                <div className="match-card-footer">
                    <Countdown startTime={startTime} />
                </div>
            </div>
        </a>
    );
}
