'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import styles from '@/app/category/[slug]/Category.module.css';
import Link from 'next/link';
import { getArticleUrl } from '@/lib/articleUtils';
import { useCountry } from '@/contexts/CountryContext';
import { NewsArticle } from '@/types/rss';
import { NewsSkeleton } from '@/components/NewsSkeleton';
import { Search } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const { countryCode } = useCountry();

    const { data: results = [], isLoading, error } = useSWR(
        query ? `/api/search?q=${encodeURIComponent(query)}&country=${countryCode}` : null,
        fetcher
    );

    if (!query) {
        return (
            <div style={{ padding: '100px 20px', textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-fraunces)', marginBottom: '1rem' }}>Search News</h1>
                <p style={{ color: '#64748b' }}>Enter a keyword to start searching.</p>
            </div>
        );
    }

    if (isLoading) return <NewsSkeleton />;

    return (
        <div className={styles.container}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2.5rem', marginBottom: '8px' }}>
                    Search Results
                </h1>
                <p style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} /> Results for "{query}" in {countryCode.replace('_', ' ')}
                </p>
            </div>

            {results.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.25rem', color: '#64748b' }}>No articles found for your search.</p>
                    <Link href="/" style={{ color: '#2563eb', fontWeight: '600', marginTop: '1rem', display: 'inline-block' }}>
                        Return to Homepage
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {results.map((art: NewsArticle, i: number) => (
                        <Link key={i} href={getArticleUrl(art)} className={styles.gridItem}>
                            <div className={styles.gridImageWrapper}>
                                <img src={art.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800'} alt="" className={styles.gridImage} />
                            </div>
                            <div className={styles.featuredContent}>
                                <span className={styles.metaTags}>{art.category || 'NEWS'}</span>
                                <h3 className={styles.gridTitle}>{art.title}</h3>
                                <p className={styles.gridExcerpt}>{art.description}</p>
                                <span className={styles.trendingMeta}>{art.pubDate}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<NewsSkeleton />}>
            <SearchResults />
        </Suspense>
    );
}
