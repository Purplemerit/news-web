'use client';

import React, { useEffect, useState } from 'react';

export default function ReadingProgress() {
    const [completion, setCompletion] = useState(0);

    useEffect(() => {
        const updateScrollCompletion = () => {
            const currentProgress = window.scrollY;
            const scrollHeight = document.body.scrollHeight - window.innerHeight;
            if (scrollHeight) {
                setCompletion(
                    Number((currentProgress / scrollHeight).toFixed(2)) * 100
                );
            }
        };

        window.addEventListener('scroll', updateScrollCompletion);
        return () => window.removeEventListener('scroll', updateScrollCompletion);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                zIndex: 1000,
                backgroundColor: '#f1f5f9',
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: `${completion}%`,
                    backgroundColor: '#2563eb',
                    transition: 'width 0.1s ease',
                }}
            />
        </div>
    );
}
