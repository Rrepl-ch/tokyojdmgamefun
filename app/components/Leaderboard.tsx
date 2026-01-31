'use client';

import { useEffect, useState } from 'react';

type LeaderboardEntry = { nickname: string; score: number; address: string; carId: number; timestamp: number; avatar?: string };

type LeaderboardProps = { onClose: () => void; currentAddress?: string };

export function Leaderboard({ onClose, currentAddress }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard?limit=20')
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? data : []))
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const addr = currentAddress?.toLowerCase();

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel leaderboard-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="menu-title">Leaderboard</h2>
        {loading ? (
          <div className="leaderboard-loading">Loading...</div>
        ) : (
          <ul className="leaderboard-list">
            {entries.length === 0 ? (
              <li className="leaderboard-empty">No scores yet. Be the first!</li>
            ) : (
              entries.map((e, i) => (
                <li
                  key={`${e.address}-${i}`}
                  className={`leaderboard-row ${e.address.toLowerCase() === addr ? 'leaderboard-row-me' : ''}`}
                >
                  <span className="leaderboard-rank">#{i + 1}</span>
                  <span className="leaderboard-avatar">{e.avatar || '😎'}</span>
                  <span className="leaderboard-nick">{e.nickname}</span>
                  <span className="leaderboard-score">{e.score}</span>
                </li>
              ))
            )}
          </ul>
        )}
        <button type="button" className="menu-btn" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
