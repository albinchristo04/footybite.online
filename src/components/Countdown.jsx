import React, { useState, useEffect } from 'react';

export default function Countdown({ startTime }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = startTime - Date.now();
        if (difference <= 0) return null;

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return {
            h: hours.toString().padStart(2, '0'),
            m: minutes.toString().padStart(2, '0'),
            s: seconds.toString().padStart(2, '0')
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    if (!timeLeft) {
        return <div className="status-badge live">LIVE NOW</div>;
    }

    return (
        <div className="status-badge upcoming">
            ⏱️ Starts in {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s
        </div>
    );
}
