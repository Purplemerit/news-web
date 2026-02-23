'use client';

import styles from './about.module.css';
import Image from 'next/image';
import { useState } from 'react';

export default function AboutPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        {
            q: 'How frequently is the news updated?',
            a: 'Our news feeds are updated in real-time, 24/7. We source from over 50 global outlets to ensure you get the latest headlines as they happen.'
        },
        {
            q: 'Can I filter news by category or interest?',
            a: 'Yes! You can use our category navigation at the top of the page to browse specific topics like Technology, Business, Sports, and International News.'
        },
        {
            q: 'Can I access older articles or archives?',
            a: 'Absolutely. Use our search feature to find articles from our archives dating back to the start of our digital publication.'
        },
        {
            q: 'How do I sign up for your newsletter?',
            a: 'You can subscribe to our daily digest at the bottom of the homepage. Just enter your email and stay updated with curated stories.'
        },
        {
            q: 'Who writes your articles?',
            a: 'Our content is written by a team of award-winning journalists and verified contributors from across the globe, ensuring high standards of reporting.'
        }
    ];

    return (
        <div className={styles.container}>
            {/* Main Hero Image */}
            <div className={styles.heroImageWrapper}>
                <div className={styles.imageRelative}>
                    <Image
                        src="/aboutimages/image copy 5.png"
                        alt="Starry Night Mountains"
                        fill
                        className={styles.heroImage}
                        priority
                    />
                </div>
            </div>

            {/* Intro Section */}
            <div className={styles.introSection}>
                <h1 className={styles.mainHeading}>
                    Empowering Minds with Stories That<br />
                    Inform, Inspire, and Connect the World
                </h1>

                <div className={styles.introGrid}>
                    {/* Left Column: Text + Stats */}
                    <div className={styles.introLeft}>
                        <p className={styles.introText}>
                            The global stock market has reached unprecedented levels, buoyed by optimistic economic forecasts and strong corporate earnings. The global stock market has reached unprecedented levels, buoyed by optimistic.
                        </p>

                        <div className={styles.statsGrid}>
                            <div className={styles.statItem}>
                                <div className={styles.statNumber}>10</div>
                                <div className={styles.statLabel}>Years of Excellence</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statNumber}>50+</div>
                                <div className={styles.statLabel}>Expert Journalists</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statNumber}>1M+</div>
                                <div className={styles.statLabel}>Monthly Readers</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statNumber}>20+</div>
                                <div className={styles.statLabel}>Industry Awards</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Two Images */}
                    <div className={styles.introImages}>
                        <div className={styles.imageContainer}>
                            <Image
                                src="/aboutimages/image copy 4.png"
                                alt="Abstract 3D Shape"
                                fill
                                className={styles.introImage}
                            />
                        </div>
                        <div className={styles.imageContainer}>
                            <Image
                                src="/aboutimages/image copy 3.png"
                                alt="Blurry Portrait"
                                fill
                                className={styles.introImage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Our Story Section */}
            <div className={styles.storySection}>
                <h2 className={styles.sectionTitle}>Our Story</h2>

                <div className={styles.storyLayout}>
                    {/* Left Col */}
                    <div className={styles.storyLeft}>
                        <h3 className={styles.empowerHeading}>
                            We empower businesses to achieve their goals
                        </h3>
                        <p className={styles.storyParagraph}>
                            The global stock market has reached unprecedented levels, buoyed by optimistic economic forecasts and strong corporate earnings.
                            <br /><br />
                            The global stock market has reached unprecedented levels, buoyed by optimistic.
                        </p>
                    </div>

                    {/* Center Col - Image */}
                    <div className={styles.storyCenter}>
                        <div className={styles.imageContainerStory}>
                            <Image
                                src="/aboutimages/image copy 2.png"
                                alt="River Landscape"
                                fill
                                className={styles.centerImage}
                            />
                        </div>
                    </div>

                    {/* Right Col */}
                    <div className={styles.storyRight}>
                        <div className={styles.missionBlock}>
                            <h4 className={styles.missionTitle}>Our Mission</h4>
                            <p className={styles.missionText}>
                                Our mission is to empower individuals and communities.
                                By delivering accurate, unbiased, and impactful news. We aim to inspire positive change, foster meaningful action, and remove barriers.
                            </p>
                        </div>
                        <div className={styles.visionBlock}>
                            <h4 className={styles.missionTitle}>Our Vision</h4>
                            <p className={styles.missionText}>
                                We envision a future where access to credible and transformative journalism bridges divides, shares perspectives, and fosters a more informed society.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trusted Source Section */}
            <div className={styles.trustedSection}>
                <div className={styles.trustedContent}>
                    <h2 className={styles.trustedHeading}>
                        Your Trusted Source for News: Breaking Stories, In-Depth Analysis.
                    </h2>

                    <p className={styles.trustedParagraph}>
                        The global stock market has reached unprecedented levels, buoyed by optimistic economic forecasts and strong corporate earnings. The global stock market has reached unprecedented levels.
                    </p>

                    <div className={styles.journalistStats}>
                        <div className={styles.statBig}>500+</div>
                        <div className={styles.statBigLabel}>Expert journalists and contributors worldwide.</div>
                        <div className={styles.avatars}>
                            <div className={styles.avatarImg} style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=1)' }}></div>
                            <div className={styles.avatarImg} style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=5)' }}></div>
                            <div className={styles.avatarImg} style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=8)' }}></div>
                            <div className={styles.avatarImg} style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=12)' }}></div>
                        </div>
                    </div>
                </div>

                <div className={styles.trustedImageWrapper}>
                    <div className={styles.imageContainerTrusted}>
                        <Image
                            src="/aboutimages/image copy.png"
                            alt="Golden Wheat Field"
                            fill
                            className={styles.trustedImage}
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className={styles.faqSection}>
                <div className={styles.faqContent}>
                    <h2 className={styles.faqHeading}>Have any Questions?</h2>

                    <div className={styles.questionsList}>
                        {faqs.map((faq, i) => (
                            <div key={i} className={styles.questionItem}>
                                <div
                                    className={styles.questionRow}
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <span>{faq.q}</span>
                                    <span className={`${styles.arrowIcon} ${openFaq === i ? styles.rotated : ''}`}>→</span>
                                </div>
                                <div className={`${styles.answerContent} ${openFaq === i ? styles.show : ''}`}>
                                    <p>{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.faqImageWrapper}>
                    <div className={styles.imageContainerFaq}>
                        <Image
                            src="/aboutimages/image.png"
                            alt="City at Night"
                            fill
                            className={styles.faqImage}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
}
