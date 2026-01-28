import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeed, convertToNewsArticles } from '@/lib/rssParser';
import { FeedCategory } from '@/types/rss';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as FeedCategory;

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    const feed = await fetchRSSFeed(category);
    const articles = convertToNewsArticles(feed.items);

    return NextResponse.json({
      success: true,
      data: {
        feed,
        articles,
      },
    });
  } catch (error) {
    console.error('Error in feeds API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed' },
      { status: 500 }
    );
  }
}
