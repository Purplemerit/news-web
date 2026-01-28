'use client';

import React from 'react';
import { X, Search, User, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';
import styles from './Sidebar.module.css';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MENU_ITEMS = [
    { name: 'Home', link: '/' },
    { name: 'International', link: '/category/international' },
    { name: 'Health', link: '/category/health' },
    { name: 'Business', link: '/category/business' },
    { name: 'Environment', link: '/category/environment' },
    { name: 'Technology', link: '/category/technology' },
    { name: 'About Us', link: '/about' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    return (
        <>
            <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose} />
            <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <div className={styles.sidebarLogo}>True Line News</div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* User Action Section (Mobile Focused) */}
                    <div className={styles.userSection}>
                        {session ? (
                            <div className={styles.userInfo}>
                                <div className={styles.userBrief}>
                                    <div className={styles.avatar}>
                                        {session.user?.image ? (
                                            <img src={session.user.image} alt="" />
                                        ) : (
                                            session.user?.name?.[0] || 'U'
                                        )}
                                    </div>
                                    <div className={styles.userDetails}>
                                        <p className={styles.userName}>{session.user?.name}</p>
                                        <p className={styles.userEmail}>{session.user?.email}</p>
                                    </div>
                                </div>
                                <div className={styles.authLinks}>
                                    <Link href="/profile" className={styles.authLink} onClick={onClose}>
                                        <User size={18} /> Profile
                                    </Link>
                                    {isAdmin && (
                                        <Link href="/admin" className={styles.authLink} onClick={onClose}>
                                            <Shield size={18} /> Admin Panel
                                        </Link>
                                    )}
                                    <button onClick={() => signOut()} className={`${styles.authLink} ${styles.logoutBtn}`}>
                                        <LogOut size={18} /> Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.guestSection}>
                                <Link href="/login" className={styles.loginBtn} onClick={onClose}>
                                    <LogIn size={18} /> Sign In
                                </Link>
                                <Link href="/signup" className={styles.signupBtn} onClick={onClose}>
                                    <UserPlus size={18} /> Join Today
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={18} />
                        <input type="text" placeholder="Search news" className={styles.searchInput} />
                    </div>

                    <div className={styles.navSection}>
                        <h2 className={styles.sectionTitle}>Main Navigation</h2>
                        <ul className={styles.menuList}>
                            {MENU_ITEMS.map((item) => (
                                <li key={item.name} className={styles.menuItem}>
                                    <Link
                                        href={item.link}
                                        className={styles.menuLink}
                                        onClick={onClose}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
