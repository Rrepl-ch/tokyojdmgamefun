import { NextRequest, NextResponse } from 'next/server';
import { getNicknameByPlayerId, hasNickname } from '@/app/lib/store';
import { isRedisAvailable, getNicknameByPlayerIdRedis } from '@/app/lib/leaderboard';

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get('playerId');
  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 });
  }
  if (isRedisAvailable()) {
    const nick = await getNicknameByPlayerIdRedis(playerId);
    return NextResponse.json({ hasNickname: !!nick, nickname: nick ?? undefined });
  }
  const has = hasNickname(playerId);
  const nickname = getNicknameByPlayerId(playerId);
  return NextResponse.json({ hasNickname: has, nickname: nickname ?? undefined });
}
