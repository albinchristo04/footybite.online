import React, { useState, useEffect } from 'react';

export default function Countdown({ startTime }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = startTime - now;

            if (diff <= 0) {
                setIsLive(true);
                setTimeLeft('🔴 LIVE NOW');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            // 7️⃣ COUNTDOWN TIMER format: ⏱️ Starts in 01h 24m
            setTimeLeft(`⏱️ Starts in ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    return (
        <div className={`countdown-text ${isLive ? 'live' : ''}`}>
            {timeLeft}
        </div>
    );
}
