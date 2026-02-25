'use client';

import { useEffect, useState } from 'react';
import { Profile } from './Profile';

type LeaderboardEntry = {
  nickname: string;
  score: number;
  playerId: string;
  carId: number;
  timestamp: number;
  avatar?: string;
};

type LeaderboardProps = { onClose: () => void; currentPlayerId?: string };

export function Leaderboard({ onClose, currentPlayerId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard?limit=20')
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? data : []))
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const myId = currentPlayerId ?? '';

  if (selectedEntry) {
    return (
      <Profile
        onClose={() => setSelectedEntry(null)}
        nickname={selectedEntry.nickname?.trim() || 'Player'}
        avatar={selectedEntry.avatar ?? ''}
        bestScore={selectedEntry.score}
        playerId={selectedEntry.playerId}
        isOwnProfile={false}
      />
    );
  }

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
                  key={`${e.playerId}-${i}`}
                  role="button"
                  tabIndex={0}
                  className={`leaderboard-row ${e.playerId === myId ? 'leaderboard-row-me' : ''}`}
                  onClick={() => setSelectedEntry(e)}
                  onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && setSelectedEntry(e)}
                >
                  <span className="leaderboard-rank">#{i + 1}</span>
                  <span className="leaderboard-avatar">
                    {e.avatar && e.avatar.startsWith('http') ? (
                      <img src={e.avatar} alt="" referrerPolicy="no-referrer" className="leaderboard-avatar-img" />
                    ) : (
                      (e.avatar || '😎')
                    )}
                  </span>
                  <span className="leaderboard-nick">{e.nickname?.trim() || 'Player'}</span>
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
