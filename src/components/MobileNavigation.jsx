import React, { useState, useEffect } from 'react';

export default function MobileNavigation({ sport = 'all' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && !e.target.closest('.mobile-nav')) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const navItems = [
        { href: '/', label: 'Home', sport: 'all' },
        { href: '/football/', label: 'Football', sport: 'football' },
        { href: '/nfl/', label: 'NFL', sport: 'nfl' },
        { href: '/nba/', label: 'NBA', sport: 'nba' },
        { href: '/boxing/', label: 'Boxing/UFC', sport: 'boxing' },
        { href: '/f1/', label: 'F1', sport: 'f1' },
        { href: '/live-streams/', label: 'All Streams', sport: 'all' }
    ];

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Navigation Header */}
            <div className={`mobile-nav-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="container">
                    <div className="mobile-nav-content">
                        <a href="/" className="mobile-logo">FOOTYBITE</a>
                        
                        <button 
                            className={`mobile-menu-toggle ${isOpen ? 'open' : ''}`}
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                            aria-expanded={isOpen}
                        >
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                            <span className="hamburger-line"></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`mobile-nav-menu ${isOpen ? 'open' : ''}`}>
                <div className="mobile-nav-overlay" onClick={closeMenu}></div>
                <div className="mobile-nav-panel">
                    <div className="mobile-nav-header-panel">
                        <div className="mobile-logo">FOOTYBITE</div>
                        <button 
                            className="mobile-nav-close"
                            onClick={closeMenu}
                            aria-label="Close menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <nav className="mobile-nav-links">
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`mobile-nav-link ${sport === item.sport ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                    
                    <div className="mobile-nav-footer">
                        <div className="mobile-nav-info">
                            <p>Watch Football, NFL, NBA and more in HD for free.</p>
                        </div>
                        <div className="mobile-nav-social">
                            <a href="/about/" className="mobile-nav-link-small">About</a>
                            <a href="/contact/" className="mobile-nav-link-small">Contact</a>
                            <a href="/dmca/" className="mobile-nav-link-small">DMCA</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}