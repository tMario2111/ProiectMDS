import React, {useRef} from 'react';
import {useState, useEffect} from 'react';

import './Clock.css';

function Clock({timeLimit}) {
    const targetTime = useRef(Date.now() + timeLimit * 1000);

    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [millis, setMillis] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const time = targetTime.current - Date.now();

            setMinutes(Math.floor((time / 1000 / 60) % 60));
            setSeconds(Math.floor((time / 1000) % 60));
            setMillis(Math.floor((time % 1000) / 100));
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return <>
        <h1 className="clock">{String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}:
            {millis}</h1>
    </>
}

export default Clock;