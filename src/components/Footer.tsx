'use client'

import React from 'react';
import Link from 'next/link';
import { Facebook, Linkedin, Instagram, Youtube } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    const categories = ['International', 'Health', 'Business', 'Environment', 'Technology', 'About Us'];

    const handleScrollTop = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (window.location.pathname === href) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.topSection}>
                <h2 className={styles.logo}>True Line News</h2>
                <nav className={styles.topNav}>
                    {categories.map((cat) => {
                        const href = cat === 'About Us' ? '/about' : `/category/${cat.toLowerCase()}`;
                        return (
                            <Link
                                key={cat}
                                href={href}
                                className={styles.topNavLink}
                                onClick={(e) => handleScrollTop(e, href)}
                            >
                                {cat}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.column}>
                    <h2 className={styles.logo} style={{ fontSize: '1.25rem' }}>True Line News</h2>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '250px' }}>
                        Delivering high-quality news and in-depth analysis from around the globe.
                    </p>
                </div>
                <div className={styles.column}>
                    <h3 className={styles.colTitle}>Engagement</h3>
                    <ul className={styles.linkList}>
                        <li className={styles.linkItem}><Link href="/about" onClick={(e) => handleScrollTop(e, '/about')}>Story</Link></li>
                        <li className={styles.linkItem}><Link href="/" onClick={(e) => handleScrollTop(e, '/')}>Topics</Link></li>
                    </ul>
                </div>
                <div className={styles.column}>
                    <h3 className={styles.colTitle}>Pages</h3>
                    <ul className={styles.linkList}>
                        <li className={styles.linkItem}><Link href="/about" onClick={(e) => handleScrollTop(e, '/about')}>About Us</Link></li>
                        <li className={styles.linkItem}><Link href="/" onClick={(e) => handleScrollTop(e, '/')}>News</Link></li>
                        <li className={styles.linkItem}><Link href="/terms" onClick={(e) => handleScrollTop(e, '/terms')}>Terms & Conditions</Link></li>
                        <li className={styles.linkItem}><Link href="/privacy" onClick={(e) => handleScrollTop(e, '/privacy')}>Privacy Policy</Link></li>
                    </ul>
                </div>

                <div className={styles.column}>
                    <h3 className={styles.colTitle}>Follow Us</h3>
                    <div className={styles.socialIcons}>
                        <Link href="#" className={styles.socialIcon}><Facebook size={20} /></Link>
                        <Link href="#" className={styles.socialIcon}><Linkedin size={20} /></Link>
                        <Link href="#" className={styles.socialIcon}><Instagram size={20} /></Link>
                        <Link href="#" className={styles.socialIcon}><Youtube size={20} /></Link>
                    </div>
                </div>
            </div>

            <div className={styles.bottomBar}>
                <div className={styles.bottomLinks}>
                    <Link href="/privacy" onClick={(e) => handleScrollTop(e, '/privacy')}>Privacy Policy</Link>
                    <Link href="/cookies" onClick={(e) => handleScrollTop(e, '/cookies')}>Cookie Policy</Link>
                    <Link href="/terms" onClick={(e) => handleScrollTop(e, '/terms')}>Website Info</Link>
                </div>
                <div className={styles.copyright}>
                    © 2026 True Line News. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
