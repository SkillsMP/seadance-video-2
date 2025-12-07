import { NextRequest, NextResponse } from 'next/server';

import { getUuid } from '@/shared/lib/hash';
import { addShowcase, NewShowcase } from '@/shared/models/showcase';
import { getUserInfo } from '@/shared/models/user';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        { code: 401, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, prompt, image } = body;

    if (!title?.trim() || !prompt?.trim() || !image?.trim()) {
      return NextResponse.json(
        { code: 400, message: 'Title, prompt and image are required' },
        { status: 400 }
      );
    }

    const newShowcase: NewShowcase = {
      id: getUuid(),
      userId: user.id,
      title: title.trim(),
      prompt: prompt.trim(),
      image: image.trim(),
    };

    const result = await addShowcase(newShowcase);

    if (!result) {
      return NextResponse.json(
        { code: 500, message: 'Failed to add showcase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: result,
    });
  } catch (error: any) {
    console.error('Add showcase error:', error);
    return NextResponse.json(
      { code: 500, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
