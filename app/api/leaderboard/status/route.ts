import { NextResponse } from 'next/server';
import { isRedisAvailable } from '@/app/lib/leaderboard';

export async function GET() {
  const ok = isRedisAvailable();
  return NextResponse.json({
    redis: ok,
    message: ok ? 'Leaderboard persists across restarts' : 'Add REDIS_URL in Vercel → Settings → Environment Variables (Redis Cloud or Upstash connection string).',
  });
}
