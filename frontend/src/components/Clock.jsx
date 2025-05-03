import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import './Clock.css';

const Clock = forwardRef(({timeLimit}, ref) => {
    const targetTime = useRef(Date.now() + timeLimit * 1000);
    const remainingTimeRef = useRef(timeLimit * 1000);
    const [isRunning, setIsRunning] = useState(false);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [millis, setMillis] = useState(0);

    const updateDisplay = (time) => {
        if (time <= 0) {
            setMinutes(0);
            setSeconds(0);
            setMillis(0);
        } else {
            setMinutes(Math.floor((time / 1000 / 60) % 60));
            setSeconds(Math.floor((time / 1000) % 60));
            setMillis(Math.floor((time % 1000) / 100));
        }
    };

    useImperativeHandle(ref, () => ({
        stop: () => {
            remainingTimeRef.current = targetTime.current - Date.now();
            updateDisplay(remainingTimeRef.current);
            setIsRunning(false);
        },
        resume: () => {
            targetTime.current = Date.now() + remainingTimeRef.current;
            setIsRunning(true);
        },

        // Important: this uses milliseconds time
        setRemainingTime: (newTime) => {
            targetTime.current = Date.now() + newTime;
            remainingTimeRef.current = newTime;

            updateDisplay(newTime);
        }
    }));

    useEffect(() => {
        updateDisplay(remainingTimeRef.current);
        if (isRunning) {
            const interval = setInterval(() => {
                const time = targetTime.current - Date.now();
                updateDisplay(time);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isRunning]);

    return (
        <h1 className="clock">
            {String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}:
            {millis}
        </h1>
    );
});

export default Clock;