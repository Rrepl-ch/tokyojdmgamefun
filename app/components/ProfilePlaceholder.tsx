'use client';

type ProfilePlaceholderProps = {
  onClose: () => void;
};

export function ProfilePlaceholder({ onClose }: ProfilePlaceholderProps) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel profile-placeholder" onClick={(e) => e.stopPropagation()}>
        <h2 className="menu-title">Profile</h2>
        <p className="profile-placeholder-text">Coming soon...</p>
        <p className="profile-placeholder-sub">Stats, achievements and more will appear here.</p>
        <button type="button" className="menu-btn" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
