import { NextRequest, NextResponse } from 'next/server';
import { registerNickname } from '@/app/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, address } = body;
    if (typeof nickname !== 'string' || !address) {
      return NextResponse.json(
        { error: 'nickname and address required' },
        { status: 400 }
      );
    }
    const result = registerNickname(nickname, String(address));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
