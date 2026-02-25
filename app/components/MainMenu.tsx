'use client';

import { useState, useCallback, useEffect } from 'react';
import { CarSelect } from './CarSelect';
import { Leaderboard } from './Leaderboard';
import { BottomNav } from './BottomNav';
import { HowToPlayPopup } from './HowToPlayPopup';
import { Profile } from './Profile';
import { CARS } from '@/app/types/cars';
import { getOrCreateGuestId } from '@/app/lib/guestId';

const STORAGE_SELECTED = 'jdm_selected_car';
const STORAGE_AVATAR = 'crazy_racer_avatar';

export const AVATAR_EMOJIS = ['🔥', '💀', '😈', '😎', '🤘', '🎸', '⚡', '🏁', '🎯', '👹', '🦇', '🖤', '⚔️', '🎭', '🔮', '🌑', '👿', '💪', '🚀', '⭐'];

function loadAvatar(): string {
  if (typeof window === 'undefined') return '😎';
  return localStorage.getItem(STORAGE_AVATAR) || '😎';
}

function loadSelectedCarId(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const n = parseInt(localStorage.getItem(STORAGE_SELECTED) ?? '0', 10);
    return Number.isFinite(n) && n >= 0 && n < CARS.length ? n : 0;
  } catch {
    return 0;
  }
}

function saveSelected(id: number) {
  localStorage.setItem(STORAGE_SELECTED, String(id));
}

export type PlayOptions = { bonusRace?: boolean; checkInMultiplier?: number };

type MainMenuProps = {
  nickname: string;
  setNickname: (v: string) => void;
  onNicknameSubmit: () => Promise<boolean>;
  onPlay: (carId: number, nick: string, avatar?: string, options?: PlayOptions) => void;
  menuKey?: number;
};

export function MainMenu({ nickname, setNickname, onNicknameSubmit: _onNicknameSubmit, onPlay, menuKey = 0 }: MainMenuProps) {
  const playerId = typeof window !== 'undefined' ? getOrCreateGuestId() : '';
  const [selectedCarId, setSelectedCarId] = useState(loadSelectedCarId);
  const [navTab, setNavTab] = useState<'howto' | 'car' | 'leaderboard' | 'profile' | null>(null);
  const [browsedCarId, setBrowsedCarId] = useState(0);
  const [nickError, setNickError] = useState('');
  const [hasNickname, setHasNickname] = useState(false);
  const [savedNickname, setSavedNickname] = useState('');
  const [record, setRecord] = useState<number | null>(null);
  const [avatar, setAvatar] = useState(() => loadAvatar());
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showNickConfirm, setShowNickConfirm] = useState(false);
  const [registerPending, setRegisterPending] = useState(false);

  const ownedCarIds = new Set(CARS.map((c) => c.id));

  const setAvatarAndSave = useCallback((emoji: string) => {
    setAvatar(emoji);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_AVATAR, emoji);
    setShowAvatarPicker(false);
  }, []);

  useEffect(() => {
    if (navTab === 'car') setBrowsedCarId(selectedCarId);
  }, [navTab, selectedCarId]);

  useEffect(() => {
    if (!playerId) return;
    fetch(`/api/nickname/status?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => r.json())
      .then((data) => {
        setHasNickname(!!data.hasNickname);
        setSavedNickname(typeof data.nickname === 'string' ? data.nickname : '');
      })
      .catch(() => {});
  }, [playerId, menuKey]);

  useEffect(() => {
    if (!playerId) return;
    fetch(`/api/leaderboard?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => r.json())
      .then((data) => setRecord(typeof data.best === 'number' ? data.best : null))
      .catch(() => setRecord(null));
  }, [playerId, menuKey]);

  const refreshRecord = useCallback(() => {
    if (!playerId) return;
    fetch(`/api/leaderboard?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => r.json())
      .then((data) => setRecord(typeof data.best === 'number' ? data.best : null))
      .catch(() => setRecord(null));
  }, [playerId]);

  const handleSelectCar = useCallback((carId: number) => {
    setSelectedCarId(carId);
    saveSelected(carId);
  }, []);

  const handleNicknameConfirm = useCallback(async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNickError('Nickname must be 2–20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setNickError('Only letters, numbers and underscore');
      return;
    }
    setNickError('');
    setRegisterPending(true);
    try {
      const res = await fetch('/api/nickname/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, nickname: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNickError(data.error || 'Failed to save nickname');
        return;
      }
      setHasNickname(true);
      setSavedNickname(trimmed);
      setShowNickConfirm(false);
    } catch {
      setNickError('Network error');
    } finally {
      setRegisterPending(false);
    }
  }, [playerId, nickname]);

  const effectiveNickname = hasNickname ? savedNickname : (nickname.trim() || 'Guest');
  const canPlay = hasNickname && ownedCarIds.has(selectedCarId);

  const handlePlay = useCallback(() => {
    setNickError('');
    onPlay(selectedCarId, effectiveNickname, avatar || undefined, { checkInMultiplier: 1 });
  }, [effectiveNickname, avatar, selectedCarId, onPlay]);

  return (
    <div className="main-menu">
      <h1 className="main-menu-title">Tokyo JDM</h1>

      <div className="main-menu-nick">
        {hasNickname ? (
          <div className="main-menu-nick-display">
            <span className="main-menu-nick-label">Nickname:</span>
            <span className="main-menu-nick-value">{savedNickname}</span>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="main-menu-input"
              placeholder="Choose nickname (once, cannot change)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
            <button
              type="button"
              className="menu-btn small mint-free"
              onClick={() => setShowNickConfirm(true)}
              disabled={registerPending || nickname.trim().length < 2}
            >
              {registerPending ? 'Saving…' : 'Save nickname'}
            </button>
          </>
        )}
      </div>
      {nickError && <p className="main-menu-error">{nickError}</p>}

      <div className="main-menu-avatar-wrap">
        <span className="main-menu-avatar-label">Avatar</span>
        <button
          type="button"
          className="main-menu-avatar-circle"
          onClick={() => setShowAvatarPicker((v) => !v)}
          title="Change avatar"
        >
          <span className="main-menu-avatar-emoji">{avatar}</span>
        </button>
        {showAvatarPicker && (
          <div className="main-menu-avatar-picker">
            <div className="main-menu-avatar-grid">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`main-menu-avatar-btn ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatarAndSave(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="main-menu-record">Record: {record !== null ? record : '—'}</p>

      <div className="main-menu-car">
        <span>{CARS[selectedCarId]?.name ?? '—'}</span>
      </div>

      <div className="main-menu-play-wrap">
        {canPlay ? (
          <button type="button" className="menu-btn play-btn" onClick={handlePlay}>
            PLAY
          </button>
        ) : (
          <div className="main-menu-play-blocked">
            <button type="button" className="menu-btn play-btn disabled" disabled>
              PLAY
            </button>
            <p className="main-menu-play-hint">
              {!hasNickname ? 'Choose and save your nickname first' : 'Choose a car to play'}
            </p>
          </div>
        )}
      </div>

      <BottomNav activeTab={navTab} onTab={(tab) => setNavTab(tab)} />

      {navTab === 'howto' && <HowToPlayPopup onClose={() => setNavTab(null)} />}
      {navTab === 'leaderboard' && (
        <Leaderboard
          onClose={() => {
            refreshRecord();
            setNavTab(null);
          }}
          currentPlayerId={playerId}
        />
      )}
      {navTab === 'profile' && (
        <Profile
          onClose={() => setNavTab(null)}
          nickname={effectiveNickname}
          avatar={avatar}
          bestScore={record}
          playerId={playerId}
        />
      )}
      {navTab === 'car' && (
        <div className="menu-overlay" onClick={() => setNavTab(null)}>
          <div className="menu-panel car-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-title">Car</h2>
            <CarSelect
              browsedCarId={browsedCarId}
              selectedCarId={selectedCarId}
              ownedCarIds={ownedCarIds}
              onSelect={handleSelectCar}
              onMintFree={() => {}}
              onMintPaid={() => {}}
              onPrevCar={() => setBrowsedCarId((prev) => Math.max(0, prev - 1))}
              onNextCar={() => setBrowsedCarId((prev) => Math.min(CARS.length - 1, prev + 1))}
              mintingCarId={null}
            />
            <button type="button" className="menu-btn" onClick={() => setNavTab(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}
      {showNickConfirm && (
        <div className="menu-overlay" onClick={() => setShowNickConfirm(false)}>
          <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-title">Confirm nickname</h2>
            <p className="nick-mint-warning">
              You can choose your nickname only once. It cannot be changed later.
            </p>
            <p className="nick-mint-preview">
              Nickname: <strong>{nickname.trim()}</strong>
            </p>
            <div className="nick-mint-actions">
              <button
                type="button"
                className="menu-btn"
                onClick={handleNicknameConfirm}
                disabled={registerPending}
              >
                {registerPending ? 'Saving…' : 'Confirm'}
              </button>
              <button
                type="button"
                className="menu-btn secondary"
                onClick={() => setShowNickConfirm(false)}
                disabled={registerPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
