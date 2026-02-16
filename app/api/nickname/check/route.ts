import { NextRequest, NextResponse } from 'next/server';
import { isNicknameAvailable } from '@/app/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nickname = body?.nickname;
    if (typeof nickname !== 'string') {
      return NextResponse.json({ error: 'nickname required' }, { status: 400 });
    }
    const available = isNicknameAvailable(nickname);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
