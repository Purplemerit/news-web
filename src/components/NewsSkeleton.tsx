'use client';

import React from 'react';

const SkeletonBase = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <div
        className={className}
        style={{
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s infinite',
            borderRadius: '4px',
            ...style
        }}
    />
);

export const NewsSkeleton = () => {
    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '120px 40px' }}>
            <style>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

            {/* Hero Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '64px' }}>
                <div>
                    <SkeletonBase style={{ width: '100%', aspectRatio: '16/9', marginBottom: '24px' }} />
                    <SkeletonBase style={{ width: '100px', height: '16px', marginBottom: '16px' }} />
                    <SkeletonBase style={{ width: '80%', height: '48px', marginBottom: '16px' }} />
                    <SkeletonBase style={{ width: '90%', height: '24px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '16px' }}>
                            <SkeletonBase style={{ width: '100px', height: '60px' }} />
                            <div style={{ flex: 1 }}>
                                <SkeletonBase style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
                                <SkeletonBase style={{ width: '60%', height: '12px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i}>
                        <SkeletonBase style={{ width: '100%', aspectRatio: '4/3', marginBottom: '16px' }} />
                        <SkeletonBase style={{ width: '40%', height: '12px', marginBottom: '12px' }} />
                        <SkeletonBase style={{ width: '100%', height: '20px', marginBottom: '8px' }} />
                        <SkeletonBase style={{ width: '80%', height: '20px' }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
