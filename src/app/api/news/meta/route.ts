import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get metadata about available news sources
 * GET /api/news/meta
 * Returns: countries, categories, and source counts
 */
export async function GET() {
  try {
    // Get all categories from database
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    // Get unique countries from news sources
    const countriesData = await prisma.newsSource.groupBy({
      by: ['country'],
      where: { active: true },
      _count: {
        country: true,
      },
    });

    // Get unique categories from news sources
    const categoriesData = await prisma.newsSource.groupBy({
      by: ['category'],
      where: { active: true },
      _count: {
        category: true,
      },
    });

    // Get total counts
    const totalSources = await prisma.newsSource.count({ where: { active: true } });
    const totalCategories = await prisma.category.count();

    // Format countries with readable names
    const countryMap: Record<string, string> = {
      INDIA: 'India',
      UNITED_STATES: 'United States',
      UNITED_KINGDOM: 'United Kingdom',
      AUSTRALIA: 'Australia',
      CANADA: 'Canada',
      GERMANY: 'Germany',
      FRANCE: 'France',
      SPAIN: 'Spain',
      ITALY: 'Italy',
      NETHERLANDS: 'Netherlands',
      IRELAND: 'Ireland',
      SWEDEN: 'Sweden',
      NORWAY: 'Norway',
      SWITZERLAND: 'Switzerland',
      JAPAN: 'Japan',
      CHINA: 'China',
      SINGAPORE: 'Singapore',
      SOUTH_KOREA: 'South Korea',
      MALAYSIA: 'Malaysia',
      THAILAND: 'Thailand',
      PHILIPPINES: 'Philippines',
      INDONESIA: 'Indonesia',
      VIETNAM: 'Vietnam',
      PAKISTAN: 'Pakistan',
      BANGLADESH: 'Bangladesh',
      SRI_LANKA: 'Sri Lanka',
      NEPAL: 'Nepal',
      TAIWAN: 'Taiwan',
      MIDDLE_EAST: 'Middle East',
      AFRICA: 'Africa',
    };

    const countries = countriesData.map(c => ({
      code: c.country,
      name: countryMap[c.country] || c.country,
      sourcesCount: c._count.country,
    })).sort((a, b) => a.name.localeCompare(b.name));

    const availableCategories = categoriesData.map(c => ({
      slug: c.category,
      sourcesCount: c._count.category,
    })).sort((a, b) => a.slug.localeCompare(b.slug));

    return NextResponse.json({
      success: true,
      data: {
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
        countries,
        availableCategories,
        stats: {
          totalSources,
          totalCategories,
          totalCountries: countries.length,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching news metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news metadata',
        details: error.message
      },
      { status: 500 }
    );
  }
}
