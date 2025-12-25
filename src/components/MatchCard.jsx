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
    const isLive = (event.starts_at * 1000) <= new Date().getTime() && (event.ends_at * 1000) > new Date().getTime();
    const isFinished = (event.ends_at * 1000) <= new Date().getTime();
    const isUpcoming = (event.starts_at * 1000) > new Date().getTime();

    const thumb = event.poster || FALLBACK_IMAGES[event.category_name] || FALLBACK_IMAGES.default;

    return (
        <a href={`/${event.url}`} className="match-card">
            <div className="match-thumb">
                <img
                    src={thumb}
                    alt={`${event.name} live stream thumbnail`}
                    loading="lazy"
                />
            </div>
            <div className="match-card-content">
                <div className="category-league">
                    <span>{event.category_name}</span>
                    <span>{event.tag || ''}</span>
                </div>
                <h3>{event.name}</h3>
                <div className="match-card-footer">
                    <div className="match-time">
                        {new Date(event.starts_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {isLive && <span className="status-badge live">LIVE</span>}
                    {isUpcoming && <Countdown startTime={event.starts_at} />}
                    {isFinished && <span className="status-badge finished">FINISHED</span>}
                </div>
            </div>
        </a>
    );
}
