'use client';

import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';

interface CopyButtonProps {
    url: string;
    size?: number;
}

export default function CopyButton({ url, size = 16 }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                color: copied ? '#22c55e' : '#94a3b8',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title="Copy Link"
        >
            {copied ? <Check size={size} /> : <Link2 size={size} />}
        </button>
    );
}
