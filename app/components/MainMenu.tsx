'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { CarSelect } from './CarSelect';
import { Leaderboard } from './Leaderboard';
import { CARS } from '@/app/types/cars';
import { useOwnedCars, useMintCar } from '@/app/lib/useCrazyRacerContract';

const STORAGE_OWNED = 'jdm_owned_cars';
const STORAGE_SELECTED = 'jdm_selected_car';
const STORAGE_AVATAR = 'crazy_racer_avatar';

export const AVATAR_EMOJIS = ['🔥', '💀', '😈', '😎', '🤘', '🎸', '⚡', '🏁', '🎯', '👹', '🦇', '🖤', '⚔️', '🎭', '🔮', '🌑', '👿', '💪', '🚀', '⭐'];

function loadAvatar(): string {
  if (typeof window === 'undefined') return '😎';
  return localStorage.getItem(STORAGE_AVATAR) || '😎';
}

function loadOwnedCarIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const s = localStorage.getItem(STORAGE_OWNED);
    if (!s) return new Set([0, 1, 2]);
    const arr = JSON.parse(s) as number[];
    return new Set(Array.isArray(arr) ? arr : [0, 1, 2]);
  } catch {
    return new Set([0, 1, 2]);
  }
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

function saveOwned(owned: Set<number>) {
  localStorage.setItem(STORAGE_OWNED, JSON.stringify([...owned]));
}

function saveSelected(id: number) {
  localStorage.setItem(STORAGE_SELECTED, String(id));
}

type MainMenuProps = {
  nickname: string;
  setNickname: (v: string) => void;
  onNicknameSubmit: () => Promise<boolean>;
  onPlay: (carId: number, nick: string) => void;
  menuKey?: number;
};

export function MainMenu({ nickname, setNickname, onNicknameSubmit, onPlay, menuKey = 0 }: MainMenuProps) {
  const [localOwned, setLocalOwned] = useState<Set<number>>(loadOwnedCarIds);
  const [selectedCarId, setSelectedCarId] = useState(loadSelectedCarId);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCarSelect, setShowCarSelect] = useState(false);
  const [browsedCarId, setBrowsedCarId] = useState(0);
  const [nickError, setNickError] = useState('');
  const [nickSuccess, setNickSuccess] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [record, setRecord] = useState<number | null>(null);
  const [avatar, setAvatar] = useState(() => loadAvatar());
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const { owned: contractOwned, isLoading: ownedLoading, refetch: refetchOwned } = useOwnedCars();
  const { mint, isPending: mintPending, contractDeployed } = useMintCar(browsedCarId, () => {
    refetchOwned();
  });

  const ownedCarIds = useMemo(() => {
    if (contractDeployed && address) return contractOwned;
    return localOwned;
  }, [contractDeployed, address, contractOwned, localOwned]);

  const mintingCarId = mintPending ? browsedCarId : null;

  const setAvatarAndSave = useCallback((emoji: string) => {
    setAvatar(emoji);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_AVATAR, emoji);
    setShowAvatarPicker(false);
  }, []);

  useEffect(() => {
    if (showCarSelect) setBrowsedCarId(selectedCarId);
  }, [showCarSelect, selectedCarId]);

  useEffect(() => {
    if (!address) {
      setRecord(null);
      return;
    }
    fetch(`/api/leaderboard?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => setRecord(typeof data.best === 'number' ? data.best : null))
      .catch(() => setRecord(null));
  }, [address, menuKey]);

  const refreshRecord = useCallback(() => {
    if (!address) return;
    fetch(`/api/leaderboard?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => setRecord(typeof data.best === 'number' ? data.best : null))
      .catch(() => setRecord(null));
  }, [address]);

  const handleSelectCar = useCallback((carId: number) => {
    setSelectedCarId(carId);
    saveSelected(carId);
  }, []);

  const handleMintFree = useCallback(
    async (carId: number) => {
      if (contractDeployed) {
        if (!address) {
          alert('Connect wallet to mint');
          return;
        }
        if (carId !== browsedCarId) return;
        mint();
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        setLocalOwned((prev) => {
          const next = new Set(prev);
          next.add(carId);
          saveOwned(next);
          return next;
        });
      }
    },
    [contractDeployed, address, browsedCarId, mint]
  );

  const handleMintPaid = useCallback(
    async (carId: number) => {
      if (!address) {
        alert('Connect wallet to buy this car');
        return;
      }
      if (contractDeployed) {
        if (carId !== browsedCarId) return;
        mint();
      } else {
        try {
          await new Promise((r) => setTimeout(r, 2000));
          setLocalOwned((prev) => {
            const next = new Set(prev);
            next.add(carId);
            saveOwned(next);
            return next;
          });
        } catch (e) {
          console.error(e);
          alert('Mint failed. Try again.');
        }
      }
    },
    [contractDeployed, address, browsedCarId, mint]
  );

  const handleNicknameSubmit = useCallback(async () => {
    setNickError('');
    setNickSuccess(false);
    if (!isConnected) {
      setNickError('Connect wallet first to save nickname.');
      return;
    }
    const ok = await onNicknameSubmit();
    if (ok) setNickSuccess(true);
    else setNickError('Nickname taken or invalid. Choose another.');
  }, [onNicknameSubmit, isConnected]);

  const handlePlay = useCallback(() => {
    setNickError('');
    onPlay(selectedCarId, nickname.trim() || 'Player');
  }, [nickname, selectedCarId, onPlay]);

  return (
    <div className="main-menu">
      <h1 className="main-menu-title">Crazy Racer</h1>

      {!isConnected && connectors.length > 0 && (
        <div className="main-menu-connect">
          <button
            type="button"
            className="menu-btn connect-btn"
            onClick={() => connect({ connector: connectors[1] ?? connectors[0] })}
          >
            Connect with Coinbase
          </button>
          <button
            type="button"
            className="menu-btn connect-btn secondary"
            onClick={() => connect({ connector: connectors[2] ?? connectors[3] ?? connectors[0] })}
          >
            Other Wallets
          </button>
        </div>
      )}
      {isConnected && address && (
        <div className="main-menu-wallet">
          <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
          <button type="button" className="link-btn" onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      )}

      <div className="main-menu-nick">
        <input
          type="text"
          className="main-menu-input"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
        />
        <button type="button" className="menu-btn small" onClick={handleNicknameSubmit}>
          SAVE
        </button>
      </div>
      {nickError && <p className="main-menu-error">{nickError}</p>}

      <div className="main-menu-avatar-wrap">
        <span className="main-menu-avatar-label">Avatar</span>
        <button
          type="button"
          className="main-menu-avatar-circle"
          onClick={() => setShowAvatarPicker((v) => !v)}
          title="Нажми, чтобы сменить"
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

      <p className="main-menu-record">
        Record: {record !== null ? record : '—'}
      </p>

      <div className="main-menu-car">
        <span>{CARS[selectedCarId]?.name ?? '—'}</span>
        <button type="button" className="menu-btn small" onClick={() => setShowCarSelect(true)}>
          Car
        </button>
      </div>

      <button type="button" className="menu-btn play-btn" onClick={handlePlay}>
        PLAY
      </button>

      <button type="button" className="menu-btn secondary" onClick={() => setShowLeaderboard(true)}>
        Leaderboard
      </button>

      {showLeaderboard && (
        <Leaderboard
          onClose={() => {
            refreshRecord();
            setShowLeaderboard(false);
          }}
          currentAddress={address ?? undefined}
        />
      )}
      {showCarSelect && (
        <div className="menu-overlay" onClick={() => setShowCarSelect(false)}>
          <div className="menu-panel car-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-title">Car</h2>
            <CarSelect
              browsedCarId={browsedCarId}
              selectedCarId={selectedCarId}
              ownedCarIds={ownedCarIds}
              onSelect={handleSelectCar}
              onMintFree={handleMintFree}
              onMintPaid={handleMintPaid}
              onPrevCar={() => setBrowsedCarId((prev) => Math.max(0, prev - 1))}
              onNextCar={() => setBrowsedCarId((prev) => Math.min(CARS.length - 1, prev + 1))}
              mintingCarId={mintingCarId}
            />
            <button type="button" className="menu-btn" onClick={() => setShowCarSelect(false)}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
