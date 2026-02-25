'use client';

import Image from 'next/image';

export type ProfileProps = {
  onClose: () => void;
  nickname: string;
  avatar: string;
  bestScore: number | null;
  playerId?: string;
  isOwnProfile?: boolean;
};

export function Profile({
  onClose,
  nickname,
  avatar,
  bestScore,
  isOwnProfile = true,
}: ProfileProps) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel profile-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="menu-title">Profile</h2>

        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {avatar.startsWith('http') ? (
              <div className="profile-avatar profile-avatar-pfp">
                <Image src={avatar} alt="" width={72} height={72} referrerPolicy="no-referrer" unoptimized />
              </div>
            ) : (
              <div className="profile-avatar profile-avatar-emoji">
                <span>{avatar || '😎'}</span>
              </div>
            )}
          </div>
          <p className="profile-nickname">{nickname || 'Player'}</p>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-label">Best score</span>
            <span className="profile-stat-value">{bestScore !== null ? bestScore : '—'}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="menu-btn" onClick={onClose}>
            {isOwnProfile ? 'Close' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  );
}
