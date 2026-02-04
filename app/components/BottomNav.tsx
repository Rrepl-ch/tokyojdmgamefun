'use client';

import Image from 'next/image';

type Tab = 'howto' | 'car' | 'leaderboard' | 'profile';

type BottomNavProps = {
  activeTab: Tab | null;
  onTab: (tab: Tab) => void;
};

const NAV_ICONS = [
  { tab: 'howto' as const, src: '/4.png', label: 'How to play' },
  { tab: 'car' as const, src: '/2.png', label: 'Car' },
  { tab: 'leaderboard' as const, src: '/1.png', label: 'Leaderboard' },
  { tab: 'profile' as const, src: '/3.png', label: 'Profile' },
];

export function BottomNav({ activeTab, onTab }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {NAV_ICONS.map(({ tab, src, label }) => (
        <button
          key={tab}
          type="button"
          className={`bottom-nav-item ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onTab(tab)}
          aria-label={label}
        >
          <span className="bottom-nav-icon">
            <Image
              src={src}
              alt=""
              width={44}
              height={44}
              className="bottom-nav-icon-img"
              unoptimized
            />
          </span>
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
