import React, { useState, useEffect } from 'react';

export default function Countdown({ startTime }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = startTime - Date.now();
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
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    if (!timeLeft) return null;

    const { hours, minutes, seconds } = timeLeft;
    return (
        <span className="countdown-text">
            {hours}h {minutes}m {seconds}s
        </span>
    );
}
