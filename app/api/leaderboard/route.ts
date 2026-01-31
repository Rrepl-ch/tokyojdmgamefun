import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, addLeaderboardEntry, getBestScoreByAddress } from '@/app/lib/store';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (address) {
    const best = getBestScoreByAddress(address);
    return NextResponse.json({ best });
  }
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100);
  const entries = getLeaderboard(limit);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, score, address, carId, avatar } = body;
    if (typeof nickname !== 'string' || typeof score !== 'number' || !address) {
      return NextResponse.json(
        { error: 'Missing or invalid nickname, score, or address' },
        { status: 400 }
      );
    }
    addLeaderboardEntry({
      nickname: nickname.trim(),
      score: Math.floor(score),
      address: String(address).toLowerCase(),
      carId: typeof carId === 'number' ? carId : 0,
      avatar: typeof avatar === 'string' ? avatar : '',
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
