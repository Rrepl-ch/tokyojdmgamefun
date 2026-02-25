import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, addLeaderboardEntry, getBestScoreByPlayerId } from '@/app/lib/store';
import {
  isRedisAvailable,
  getLeaderboardRedis,
  addLeaderboardEntryRedis,
  getBestScoreByPlayerIdRedis,
} from '@/app/lib/leaderboard';

const PLAYER_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

/** Max score per second (generous). */
const MAX_SCORE_PER_SECOND = 5500;
const MAX_SCORE_ABSOLUTE = 5_000_000;
const MIN_DURATION_MS = 1000;

function isScorePlausible(score: number, durationMs: number): boolean {
  if (score <= 0 || durationMs < MIN_DURATION_MS) return false;
  const durationSec = durationMs / 1000;
  const maxForDuration = durationSec * MAX_SCORE_PER_SECOND;
  if (score > maxForDuration) return false;
  if (score > MAX_SCORE_ABSOLUTE) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get('playerId');
  if (playerId) {
    const best = isRedisAvailable()
      ? await getBestScoreByPlayerIdRedis(playerId)
      : getBestScoreByPlayerId(playerId);
    return NextResponse.json({ best });
  }
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 100);
  const entries = isRedisAvailable() ? await getLeaderboardRedis(limit) : getLeaderboard(limit);
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, score, playerId, carId, avatar, durationMs } = body;
    if (typeof nickname !== 'string' || typeof score !== 'number' || !playerId || typeof playerId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid nickname, score, or playerId' },
        { status: 400 }
      );
    }
    if (!PLAYER_ID_REGEX.test(playerId.trim())) {
      return NextResponse.json({ error: 'Invalid playerId' }, { status: 400 });
    }
    const floorScore = Math.floor(score);
    const duration = typeof durationMs === 'number' ? durationMs : 0;
    if (!isScorePlausible(floorScore, duration)) {
      return NextResponse.json(
        { error: 'Score rejected: invalid or impossible for reported game duration' },
        { status: 400 }
      );
    }
    const pid = playerId.trim();
    const entry = {
      nickname: nickname.trim(),
      score: floorScore,
      playerId: pid,
      carId: typeof carId === 'number' ? carId : 0,
      avatar: typeof avatar === 'string' ? avatar : '',
    };
    if (isRedisAvailable()) {
      await addLeaderboardEntryRedis(entry);
    } else {
      addLeaderboardEntry(entry);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
