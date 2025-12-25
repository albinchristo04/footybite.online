import React, { useState, useEffect } from 'react';

export default function Countdown({ startTime, onLive }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = startTime * 1000 - new Date().getTime();
        if (difference <= 0) return null;

        const hours = Math.floor((difference / (1000 * 60 * 60)));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return { hours, minutes, seconds };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left) {
                clearInterval(timer);
                if (onLive) onLive();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    if (!timeLeft) return <span className="status-badge live">LIVE NOW</span>;

    const { hours, minutes, seconds } = timeLeft;
    return (
        <span className="countdown-timer">
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
    );
}
