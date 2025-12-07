import { NextRequest, NextResponse } from 'next/server';

import { getLatestShowcases } from '@/shared/models/showcase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const showcases = await getLatestShowcases(limit);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: showcases,
    });
  } catch (error: any) {
    console.error('Get showcases error:', error);
    return NextResponse.json(
      { code: 500, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
