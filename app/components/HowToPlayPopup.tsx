'use client';

type HowToPlayPopupProps = {
  onClose: () => void;
};

export function HowToPlayPopup({ onClose }: HowToPlayPopupProps) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel welcome-popup" onClick={(e) => e.stopPropagation()}>
        <h2 className="welcome-popup-title">Tokyo JDM</h2>
        <p className="welcome-popup-text">
          Tunnel racer — drive through neon tunnels, dodge oncoming cars, beat your best score.
        </p>
        <p className="welcome-popup-text">
          Avoid crashes. The longer you last, the higher your score.
        </p>
        <ol className="welcome-popup-steps">
          <li>Choose and mint a car</li>
          <li>Hit PLAY and race</li>
        </ol>
        <button type="button" className="menu-btn welcome-popup-btn" onClick={onClose}>
          GOT IT
        </button>
      </div>
    </div>
  );
}
