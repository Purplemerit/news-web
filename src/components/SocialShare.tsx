'use client';

import React from 'react';
import {
    TwitterIcon,
    FacebookIcon,
    WhatsappIcon,
    TwitterShareButton,
    FacebookShareButton,
    WhatsappShareButton
} from 'react-share';
import { Link2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SocialShareProps {
    url?: string;
    title: string;
}

export default function SocialShare({ url: initialUrl, title }: SocialShareProps) {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState(initialUrl || '');

    useEffect(() => {
        if (!initialUrl && typeof window !== 'undefined') {
            setUrl(window.location.href);
        }
    }, [initialUrl]);

    const activeUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(activeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <TwitterShareButton url={activeUrl} title={title}>
                <TwitterIcon size={32} round />
            </TwitterShareButton>

            <FacebookShareButton url={activeUrl}>
                <FacebookIcon size={32} round />
            </FacebookShareButton>

            <WhatsappShareButton url={activeUrl} title={title}>
                <WhatsappIcon size={32} round />
            </WhatsappShareButton>

            <button
                onClick={copyToClipboard}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                title="Copy Link"
            >
                {copied ? <Check size={16} color="#22c55e" /> : <Link2 size={16} color="#64748b" />}
            </button>
        </div>
    );
}
