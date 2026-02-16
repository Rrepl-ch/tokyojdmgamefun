'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const STORAGE_KEY = 'jdm_welcome_seen';

export function WelcomePopup() {
  const { address } = useAccount();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !address) return;
    setShow(!localStorage.getItem(STORAGE_KEY));
  }, [address]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="welcome-popup-overlay" onClick={handleClose}>
      <div className="welcome-popup" onClick={(e) => e.stopPropagation()}>
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
        <button type="button" className="menu-btn welcome-popup-btn" onClick={handleClose}>
          GOT IT
        </button>
      </div>
    </div>
  );
}
