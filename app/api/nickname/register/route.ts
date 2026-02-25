import { NextRequest, NextResponse } from 'next/server';
import { registerNickname } from '@/app/lib/store';
import { isRedisAvailable, registerNicknameRedis, hasNicknameRedis } from '@/app/lib/leaderboard';

const PLAYER_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, playerId } = body;
    if (typeof nickname !== 'string' || !playerId || typeof playerId !== 'string') {
      return NextResponse.json(
        { error: 'nickname and playerId required' },
        { status: 400 }
      );
    }
    if (!PLAYER_ID_REGEX.test(playerId.trim())) {
      return NextResponse.json({ error: 'Invalid playerId' }, { status: 400 });
    }
    const pid = playerId.trim();
    if (isRedisAvailable()) {
      const already = await hasNicknameRedis(pid);
      if (already) {
        return NextResponse.json({ error: 'You already have a nickname and cannot change it' }, { status: 400 });
      }
      const result = await registerNicknameRedis(pid, nickname);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } else {
      const result = registerNickname(pid, nickname);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
