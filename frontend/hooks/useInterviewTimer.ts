import { useState, useEffect } from 'react';

export const useInterviewTimer = (setupData: any) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [inQnaMode, setInQnaMode] = useState(false);
    const [isTimerEnabled, setIsTimerEnabled] = useState(false);

    useEffect(() => {
        if (setupData?.type === 'Practice Mode') {
            setIsTimerEnabled(false);
        } else if (setupData?.duration) {
            const durationMinutes = parseInt(setupData.duration, 10);
            if (!isNaN(durationMinutes)) {
                setTimeLeft(durationMinutes * 60);
                setIsTimerEnabled(true);
            }
        }
    }, [setupData]);

    useEffect(() => {
        if (!isTimerEnabled || isTimeUp) return;

        if (timeLeft <= 0) {
            setIsTimeUp(true);
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, isTimeUp, isTimerEnabled]);

    const formatTime = (seconds: number) => {
        if (seconds < 0) seconds = 0;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return { timeLeft, isTimeUp, inQnaMode, isTimerEnabled, setInQnaMode, formatTime };
};
