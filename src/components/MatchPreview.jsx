import React, { useState, useEffect } from 'react';
import { TextSkeleton } from './SkeletonLoader';

export default function MatchPreview({ event }) {
    const [isLoading, setIsLoading] = useState(true);
    const [teamStats, setTeamStats] = useState(null);
    const [showFullPreview, setShowFullPreview] = useState(false);

    const { teams, league, sport } = event;

    // Simulate fetching team statistics
    useEffect(() => {
        const fetchTeamStats = async () => {
            setIsLoading(true);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock statistics data (in real app, this would come from an API)
            const mockStats = {
                headToHead: {
                    matches: 12,
                    homeWins: 7,
                    awayWins: 3,
                    draws: 2
                },
                homeForm: ['W', 'L', 'W', 'D', 'W'], // Last 5 matches
                awayForm: ['D', 'W', 'L', 'L', 'W'],
                homeStats: {
                    played: 25,
                    won: 15,
                    drawn: 6,
                    lost: 4,
                    goalsFor: 42,
                    goalsAgainst: 18
                },
                awayStats: {
                    played: 25,
                    won: 12,
                    drawn: 7,
                    lost: 6,
                    goalsFor: 38,
                    goalsAgainst: 22
                }
            };
            
            setTeamStats(mockStats);
            setIsLoading(false);
        };

        if (teams && teams.length >= 2) {
            fetchTeamStats();
        }
    }, [teams]);

    const getFormColor = (result) => {
        switch (result) {
            case 'W': return '#22c55e'; // green
            case 'D': return '#fbbf24'; // yellow
            case 'L': return '#ef4444'; // red
            default: return '#6b7280';
        }
    };

    const getFormLabel = (result) => {
        switch (result) {
            case 'W': return 'Win';
            case 'D': return 'Draw';
            case 'L': return 'Loss';
            default: return '-';
        }
    };

    if (!teams || teams.length < 2) {
        return null;
    }

    return (
        <div className="match-preview">
            <div className="match-preview-header">
                <h3>Match Preview</h3>
                <button 
                    className="preview-toggle-btn"
                    onClick={() => setShowFullPreview(!showFullPreview)}
                    aria-expanded={showFullPreview}
                >
                    {showFullPreview ? 'Show Less' : 'Show More'}
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ transform: showFullPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>

            {isLoading ? (
                <div className="preview-loading">
                    <TextSkeleton lines={3} />
                </div>
            ) : (
                <div className={`preview-content ${showFullPreview ? 'expanded' : 'collapsed'}`}>
                    {/* Head to Head */}
                    <div className="preview-section">
                        <h4>Head to Head</h4>
                        <div className="h2h-stats">
                            <div className="h2h-record">
                                <span className="team-name">{teams[0]}</span>
                                <div className="h2h-score">
                                    <span className="wins">{teamStats.headToHead.homeWins}</span>
                                    <span className="draws">{teamStats.headToHead.draws}</span>
                                    <span className="wins">{teamStats.headToHead.awayWins}</span>
                                </div>
                                <span className="team-name">{teams[1]}</span>
                            </div>
                            <div className="h2h-total">
                                Last {teamStats.headToHead.matches} meetings
                            </div>
                        </div>
                    </div>

                    {/* Team Form */}
                    <div className="preview-section">
                        <h4>Recent Form</h4>
                        <div className="form-container">
                            <div className="team-form">
                                <div className="form-team">{teams[0]}</div>
                                <div className="form-results">
                                    {teamStats.homeForm.map((result, index) => (
                                        <div 
                                            key={index} 
                                            className="form-result"
                                            style={{ backgroundColor: getFormColor(result) }}
                                            title={getFormLabel(result)}
                                        >
                                            {result}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="team-form">
                                <div className="form-team">{teams[1]}</div>
                                <div className="form-results">
                                    {teamStats.awayForm.map((result, index) => (
                                        <div 
                                            key={index} 
                                            className="form-result"
                                            style={{ backgroundColor: getFormColor(result) }}
                                            title={getFormLabel(result)}
                                        >
                                            {result}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {showFullPreview && (
                        <>
                            {/* Season Statistics */}
                            <div className="preview-section">
                                <h4>Season Statistics</h4>
                                <div className="stats-comparison">
                                    <div className="team-stats">
                                        <div className="stats-team">{teams[0]}</div>
                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <span className="stat-label">Played</span>
                                                <span className="stat-value">{teamStats.homeStats.played}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Won</span>
                                                <span className="stat-value">{teamStats.homeStats.won}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Drawn</span>
                                                <span className="stat-value">{teamStats.homeStats.drawn}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Lost</span>
                                                <span className="stat-value">{teamStats.homeStats.lost}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Goals</span>
                                                <span className="stat-value">{teamStats.homeStats.goalsFor}:{teamStats.homeStats.goalsAgainst}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="team-stats">
                                        <div className="stats-team">{teams[1]}</div>
                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <span className="stat-label">Played</span>
                                                <span className="stat-value">{teamStats.awayStats.played}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Won</span>
                                                <span className="stat-value">{teamStats.awayStats.won}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Drawn</span>
                                                <span className="stat-value">{teamStats.awayStats.drawn}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Lost</span>
                                                <span className="stat-value">{teamStats.awayStats.lost}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Goals</span>
                                                <span className="stat-value">{teamStats.awayStats.goalsFor}:{teamStats.awayStats.goalsAgainst}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Key Insights */}
                            <div className="preview-section">
                                <h4>Key Insights</h4>
                                <div className="insights-list">
                                    <div className="insight-item">
                                        <span className="insight-icon">📊</span>
                                        <span>{teams[0]} has won {teamStats.headToHead.homeWins} of the last {teamStats.headToHead.matches} meetings</span>
                                    </div>
                                    <div className="insight-item">
                                        <span className="insight-icon">⚽</span>
                                        <span>{teams[0]} averages {(teamStats.homeStats.goalsFor / teamStats.homeStats.played).toFixed(1)} goals per game</span>
                                    </div>
                                    <div className="insight-item">
                                        <span className="insight-icon">🏆</span>
                                        <span>{teams[1]} has a better away record with {teamStats.awayStats.won} away wins</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}