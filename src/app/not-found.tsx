import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 20px'
        }}>
            <h1 style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 'clamp(5rem, 15vw, 10rem)',
                margin: 0,
                color: '#f1f5f9',
                position: 'absolute',
                zIndex: -1
            }}>404</h1>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    color: '#0f172a'
                }}>Story not found.</h2>
                <p style={{
                    color: '#64748b',
                    marginBottom: '2rem',
                    maxWidth: '400px'
                }}>
                    The page you are looking for might have been moved, deleted, or never existed in the first place.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link href="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#0f172a',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none'
                    }}>
                        <Home size={18} /> Back Home
                    </Link>
                    <Link href="/search" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none'
                    }}>
                        <Search size={18} /> Search News
                    </Link>
                </div>
            </div>
        </div>
    );
}
