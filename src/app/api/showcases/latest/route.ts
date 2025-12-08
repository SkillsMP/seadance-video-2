import { NextRequest, NextResponse } from 'next/server';

import { getLatestShowcases } from '@/shared/models/showcase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const tags = searchParams.get('tags') || undefined;
    const excludeTags = searchParams.get('excludeTags') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    console.log('Fetching latest showcases with params:', { limit, tags, excludeTags, searchTerm, sortOrder });
    try {
      const showcases = await getLatestShowcases({
        limit,
        tags,
        excludeTags,
        searchTerm,
        sortOrder,
      });
      console.log(`Found ${showcases.length} showcases`);
      
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: showcases,
      });
    } catch (err: any) {
       console.error('Error fetching showcases inside route handler:', err);
       throw err;
    }
  } catch (error: any) {
    console.error('Get showcases error:', error);
    return NextResponse.json(
      { code: 500, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
