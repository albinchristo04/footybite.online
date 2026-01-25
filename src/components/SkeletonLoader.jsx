import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
    const renderCardSkeleton = () => (
        <div className="skeleton-card">
            <div className="skeleton-thumb-wrapper">
                <div className="skeleton-league-badge"></div>
                <div className="skeleton-thumb"></div>
            </div>
            <div className="skeleton-card-content">
                <div className="skeleton-date"></div>
                <div className="skeleton-teams">
                    <div className="skeleton-team"></div>
                    <div className="skeleton-team"></div>
                </div>
                <div className="skeleton-footer">
                    <div className="skeleton-status"></div>
                </div>
            </div>
        </div>
    );

    const renderMatchSkeleton = () => (
        <div className="skeleton-match">
            <div className="skeleton-match-header">
                <div className="skeleton-league"></div>
                <div className="skeleton-status"></div>
            </div>
            <div className="skeleton-match-content">
                <div className="skeleton-teams-row">
                    <div className="skeleton-team-large"></div>
                    <div className="skeleton-score"></div>
                    <div className="skeleton-team-large"></div>
                </div>
                <div className="skeleton-match-info">
                    <div className="skeleton-time"></div>
                    <div className="skeleton-venue"></div>
                </div>
            </div>
        </div>
    );

    const renderTextSkeleton = () => (
        <div className="skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
        </div>
    );

    const renderSkeleton = () => {
        switch (type) {
            case 'match':
                return renderMatchSkeleton();
            case 'text':
                return renderTextSkeleton();
            case 'card':
            default:
                return renderCardSkeleton();
        }
    };

    return (
        <div className="skeleton-container">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="skeleton-item">
                    {renderSkeleton()}
                </div>
            ))}
        </div>
    );
}

// Individual skeleton components for specific use cases
export const CardSkeleton = () => (
    <div className="skeleton-card">
        <div className="skeleton-thumb-wrapper">
            <div className="skeleton-league-badge"></div>
            <div className="skeleton-thumb"></div>
        </div>
        <div className="skeleton-card-content">
            <div className="skeleton-date"></div>
            <div className="skeleton-teams">
                <div className="skeleton-team"></div>
                <div className="skeleton-team"></div>
            </div>
            <div className="skeleton-footer">
                <div className="skeleton-status"></div>
            </div>
        </div>
    </div>
);

export const MatchSkeleton = () => (
    <div className="skeleton-match">
        <div className="skeleton-match-header">
            <div className="skeleton-league"></div>
            <div className="skeleton-status"></div>
        </div>
        <div className="skeleton-match-content">
            <div className="skeleton-teams-row">
                <div className="skeleton-team-large"></div>
                <div className="skeleton-score"></div>
                <div className="skeleton-team-large"></div>
            </div>
            <div className="skeleton-match-info">
                <div className="skeleton-time"></div>
                <div className="skeleton-venue"></div>
            </div>
        </div>
    </div>
);

export const TextSkeleton = ({ lines = 2 }) => (
    <div className="skeleton-text">
        {Array.from({ length: lines }, (_, index) => (
            <div 
                key={index} 
                className={`skeleton-line ${index === lines - 1 ? 'short' : ''}`}
            ></div>
        ))}
    </div>
);