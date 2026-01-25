import React, { useState, useEffect } from 'react';

export default function EnhancedHero() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic hero content with different sports
    const heroSlides = [
        {
            id: 1,
            sport: 'Football',
            title: 'Live Football Streams',
            subtitle: 'Premier League, Champions League & More',
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
            gradient: 'linear-gradient(135deg, rgba(255,45,45,0.8) 0%, rgba(255,65,108,0.6) 100%)',
            cta: '/football/'
        },
        {
            id: 2,
            sport: 'NBA',
            title: 'NBA Basketball Live',
            subtitle: 'Watch Every Game in HD Quality',
            image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
            gradient: 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(245,158,11,0.6) 100%)',
            cta: '/nba/'
        },
        {
            id: 3,
            sport: 'NFL',
            title: 'NFL Sunday Ticket',
            subtitle: 'Never Miss a Touchdown',
            image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=1200&auto=format&fit=crop',
            gradient: 'linear-gradient(135deg, rgba(34,197,94,0.8) 0%, rgba(16,185,129,0.6) 100%)',
            cta: '/nfl/'
        }
    ];

    // Auto-rotate slides
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [heroSlides.length]);

    // Preload images
    useEffect(() => {
        const preloadImages = heroSlides.map(slide => {
            const img = new Image();
            img.src = slide.image;
            return img;
        });

        Promise.all(preloadImages).then(() => {
            setIsLoading(false);
        });
    }, []);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    const currentSlideData = heroSlides[currentSlide];

    if (isLoading) {
        return (
            <div className="enhanced-hero">
                <div className="hero-skeleton">
                    <div className="skeleton-slide"></div>
                </div>
            </div>
        );
    }

    return (
        <section className="enhanced-hero">
            <div className="hero-slider">
                {heroSlides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{
                            backgroundImage: `${slide.gradient}, url(${slide.image})`,
                            opacity: index === currentSlide ? 1 : 0,
                            transform: index === currentSlide ? 'scale(1)' : 'scale(1.1)'
                        }}
                    >
                        <div className="hero-slide-overlay"></div>
                    </div>
                ))}
            </div>

            <div className="hero-content">
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-text">
                            <div className="hero-badges">
                                <span className="hero-badge">🔴 LIVE NOW</span>
                                <span className="hero-badge">HD QUALITY</span>
                                <span className="hero-badge">FREE STREAMS</span>
                            </div>
                            
                            <h1 className="hero-title">
                                {currentSlideData.title}
                            </h1>
                            
                            <p className="hero-subtitle">
                                {currentSlideData.subtitle}
                            </p>
                            
                            <div className="hero-actions">
                                <a href={currentSlideData.cta} className="hero-btn primary">
                                    Watch Now
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                </a>
                                <a href="/live-streams/" className="hero-btn secondary">
                                    All Sports
                                </a>
                            </div>

                            <div className="hero-stats">
                                <div className="stat-item">
                                    <span className="stat-number">500+</span>
                                    <span className="stat-label">Live Events</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">HD</span>
                                    <span className="stat-label">Quality</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">24/7</span>
                                    <span className="stat-label">Available</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="hero-visual">
                            <div className="hero-card-floating">
                                <div className="floating-card">
                                    <div className="card-preview">
                                        <div className="preview-thumb">
                                            <div className="preview-live-indicator">LIVE</div>
                                        </div>
                                        <div className="preview-content">
                                            <div className="preview-teams">
                                                <span>Team A</span>
                                                <span>vs</span>
                                                <span>Team B</span>
                                            </div>
                                            <div className="preview-league">Champions League</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slider Controls */}
            <div className="hero-controls">
                <button className="hero-nav-btn prev" onClick={prevSlide} aria-label="Previous slide">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <div className="hero-indicators">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
                
                <button className="hero-nav-btn next" onClick={nextSlide} aria-label="Next slide">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </section>
    );
}