import React, { useState, useEffect, useCallback } from 'react';

export default function NotificationSystem({ events }) {
    const [notifications, setNotifications] = useState([]);
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);

    // Check browser support and permission
    useEffect(() => {
        setIsSupported('Notification' in window);
        
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Request notification permission
    const requestPermission = async () => {
        if (!isSupported) return false;
        
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    };

    // Check for upcoming matches and create notifications
    const checkUpcomingMatches = useCallback(() => {
        if (permission !== 'granted') return;

        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        events.forEach(event => {
            const timeUntilMatch = event.startTime - now;
            
            // Notify if match starts in 5 minutes or less (but hasn't started)
            if (event.status === 'upcoming' && timeUntilMatch > 0 && timeUntilMatch <= fiveMinutes) {
                const notificationTitle = `Match Starting Soon!`;
                const notificationOptions = {
                    body: `${event.teams.join(' vs ')} is starting in ${Math.ceil(timeUntilMatch / 60000)} minutes`,
                    icon: '/assets/notification-icon.png',
                    badge: '/assets/badge-icon.png',
                    tag: `match-${event.id}`,
                    renotify: true,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'watch',
                            title: 'Watch Now'
                        },
                        {
                            action: 'dismiss',
                            title: 'Dismiss'
                        }
                    ]
                };

                // Check if we already notified for this match
                const alreadyNotified = localStorage.getItem(`notified-${event.id}`);
                if (!alreadyNotified) {
                    const notification = new Notification(notificationTitle, notificationOptions);
                    
                    // Handle notification click
                    notification.onclick = (event) => {
                        event.target.close();
                        window.location.href = `/${event.url}`;
                    };

                    // Handle notification actions
                    notification.onclose = () => {
                        localStorage.setItem(`notified-${event.id}`, 'true');
                    };

                    // Add to in-app notifications
                    setNotifications(prev => [{
                        id: event.id,
                        title: notificationTitle,
                        message: notificationOptions.body,
                        type: 'upcoming',
                        timestamp: now,
                        event: event
                    }, ...prev.slice(0, 4)]); // Keep only 5 recent notifications
                }
            }
        });
    }, [events, permission]);

    // Check for matches that just started (live)
    const checkLiveMatches = useCallback(() => {
        if (permission !== 'granted') return;

        const recentlyStarted = events.filter(event => {
            const startedWithinLastMinute = Date.now() - event.startTime <= 60000;
            return event.status === 'live' && startedWithinLastMinute;
        });

        recentlyStarted.forEach(event => {
            const alreadyNotified = localStorage.getItem(`live-notified-${event.id}`);
            if (!alreadyNotified) {
                const notification = new Notification(`🔴 NOW LIVE!`, {
                    body: `${event.teams.join(' vs ')} is now live`,
                    icon: '/assets/live-icon.png',
                    tag: `live-${event.id}`,
                    renotify: true,
                    requireInteraction: false
                });

                localStorage.setItem(`live-notified-${event.id}`, 'true');
                
                setNotifications(prev => [{
                    id: `live-${event.id}`,
                    title: '🔴 NOW LIVE!',
                    message: `${event.teams.join(' vs ')} is now live`,
                    type: 'live',
                    timestamp: Date.now(),
                    event: event
                }, ...prev.slice(0, 4)]);
            }
        });
    }, [events, permission]);

    // Check for matches periodically
    useEffect(() => {
        const interval = setInterval(() => {
            checkUpcomingMatches();
            checkLiveMatches();
        }, 60000); // Check every minute

        // Initial check
        checkUpcomingMatches();
        checkLiveMatches();

        return () => clearInterval(interval);
    }, [checkUpcomingMatches, checkLiveMatches]);

    // Remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // Don't render if not supported or no notifications
    if (!isSupported || notifications.length === 0) {
        return (
            <div className="notification-system">
                {permission === 'default' && (
                    <div className="notification-permission-prompt">
                        <button 
                            className="enable-notifications-btn"
                            onClick={requestPermission}
                        >
                            🔔 Enable Match Notifications
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="notification-system">
            <div className="notification-container">
                <div className="notification-header">
                    <h4>Notifications</h4>
                    <button 
                        className="clear-notifications-btn"
                        onClick={clearAllNotifications}
                        aria-label="Clear all notifications"
                    >
                        Clear All
                    </button>
                </div>
                
                <div className="notification-list">
                    {notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            className={`notification-item ${notification.type}`}
                        >
                            <div className="notification-content">
                                <div className="notification-title">
                                    {notification.title}
                                </div>
                                <div className="notification-message">
                                    {notification.message}
                                </div>
                                <div className="notification-time">
                                    {new Date(notification.timestamp).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                            </div>
                            
                            <div className="notification-actions">
                                {notification.event && (
                                    <a 
                                        href={`/${notification.event.url}`}
                                        className="notification-action-btn primary"
                                    >
                                        Watch
                                    </a>
                                )}
                                <button 
                                    className="notification-action-btn close"
                                    onClick={() => removeNotification(notification.id)}
                                    aria-label="Dismiss notification"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}