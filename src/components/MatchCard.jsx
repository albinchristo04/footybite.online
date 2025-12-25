import React from 'react';
import Countdown from './Countdown';

const FALLBACK_IMAGES = {
    'American Football': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop',
    'Soccer': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
    'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    'Fighting': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop',
    'Formula 1': 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=800&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop'
};

export default function MatchCard({ event }) {
    const startTime = event.starts_at * 1000;
    const endTime = event.ends_at * 1000;
    const now = new Date().getTime();

    const isLive = now >= startTime && now < endTime;
    const isFinished = now >= endTime;
    const isUpcoming = now < startTime;

    const thumb = event.poster || FALLBACK_IMAGES[event.category_name] || FALLBACK_IMAGES.default;

    // Split name into teams if possible (e.g., "Team A vs. Team B")
    const teams = event.name.split(/ vs\.? /i);

    return (
        <a href={`/${event.url}`} className="match-card">
            <div className="match-thumb-wrapper">
                <div className="league-badge">{event.tag || event.category_name}</div>
                <img
                    src={thumb}
                    alt={`${event.name} live stream thumbnail`}
                    loading="lazy"
                />
                <div className="match-status-overlay">
                    {isLive && <span className="status-badge live">LIVE NOW</span>}
                </div>
            </div>

            <div className="match-card-content">
                <div className="match-date-small">
                    {new Date(startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="match-teams">
                    {teams.length === 2 ? (
                        <>
                            <div className="team-row">
                                <span className="team-name">{teams[0]}</span>
                            </div>
                            <div className="team-row">
                                <span className="team-name">{teams[1]}</span>
                            </div>
                        </>
                    ) : (
                        <div className="team-row">
                            <span className="team-name">{event.name}</span>
                        </div>
                    )}
                </div>

                <div className="match-card-footer">
                    {isUpcoming && (
                        <div className="status-badge upcoming">
                            <span>⏱️ Starts in </span>
                            <Countdown startTime={event.starts_at} />
                        </div>
                    )}
                    {isLive && <span className="status-badge live">LIVE NOW</span>}
                    {isFinished && <span className="status-badge finished">FINISHED</span>}
                </div>
            </div>
        </a>
    );
}
