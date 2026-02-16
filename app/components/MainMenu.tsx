'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { CarSelect } from './CarSelect';
import { Leaderboard } from './Leaderboard';
import { BottomNav } from './BottomNav';
import { HowToPlayPopup } from './HowToPlayPopup';
import { Profile } from './Profile';
import { CARS } from '@/app/types/cars';
import { useOwnedCars, useMintCar } from '@/app/lib/useCrazyRacerContract';
import { useNicknameStatus, useMintNickname } from '@/app/lib/useNicknameContract';
import { useCheckInStatus, useCheckIn } from '@/app/lib/useCheckInContract';
import { useBonusRace } from '@/app/lib/useBonusRaceContract';
// import { useScoreRewardClaim } from '@/app/lib/useScoreRewardClaim';
import { useMiniApp } from '@/app/providers/MiniAppProvider';
import { getProfileStats, fetchProfileStatsFromApi } from '@/app/lib/profileStats';

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
    if (!s) return new Set();
    const arr = JSON.parse(s) as number[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
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

export function MainMenu({ nickname, setNickname, onNicknameSubmit, onPlay, menuKey = 0 }: MainMenuProps) {
  const [localOwned] = useState<Set<number>>(loadOwnedCarIds);
  const [selectedCarId, setSelectedCarId] = useState(loadSelectedCarId);
  const [navTab, setNavTab] = useState<'howto' | 'car' | 'leaderboard' | 'profile' | null>(null);
  const [showNickMintConfirm, setShowNickMintConfirm] = useState(false);
  const [browsedCarId, setBrowsedCarId] = useState(0);
  const [nickError, setNickError] = useState('');
  const [, setNickSuccess] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [record, setRecord] = useState<number | null>(null);
  const [avatar, setAvatar] = useState(() => loadAvatar());
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [showBonusModal, setShowBonusModal] = useState(false);
  // const [tokenBalanceWei, setTokenBalanceWei] = useState<string>('0');
  // fetchTokenBalance, useScoreRewardClaim — отключено (реворды за заезд)

  const { owned: contractOwned, refetch: refetchOwned } = useOwnedCars();
  const { canCheckInToday, streak, refetch: refetchCheckIn } = useCheckInStatus();
  const { checkIn, isPending: checkInPending, contractDeployed: checkInDeployed } = useCheckIn(refetchCheckIn);
  const { triggerBonus, isPending: bonusPending, isSuccess: bonusSuccess, contractDeployed: bonusDeployed } = useBonusRace();
  const { mint, isPending: mintPending, contractDeployed } = useMintCar(browsedCarId, () => {
    refetchOwned();
  });

  const { context: miniAppContext } = useMiniApp();
  const baseUser = miniAppContext?.user;
  const { hasNickname, nickname: contractNickname, refetch: refetchNick, contractDeployed: nickContractDeployed } = useNicknameStatus();
  const { mint: mintNickname, isPending: mintNickPending, error: mintNickError } = useMintNickname(() => refetchNick());

  useEffect(() => {
    if (mintNickError) setNickError(mintNickError.message || 'Mint failed');
  }, [mintNickError]);

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
    if (navTab === 'car') setBrowsedCarId(selectedCarId);
  }, [navTab, selectedCarId]);

  useEffect(() => {
    if (!address) {
      setRecord(null);
      setTotalGames(0);
      return;
    }
    fetch(`/api/leaderboard?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => setRecord(typeof data.best === 'number' ? data.best : null))
      .catch(() => setRecord(null));
    const local = getProfileStats(address);
    setTotalGames(local?.totalGames ?? 0);
    fetchProfileStatsFromApi(address).then((s) => {
      if (s) setTotalGames(s.totalGames);
    });
    // fetchTokenBalance(); — реворды за заезд отключены
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
        alert('Contract not configured. Add NEXT_PUBLIC_CRAZY_RACER_CONTRACT to Vercel env and redeploy.');
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
        alert('Contract not configured. Add NEXT_PUBLIC_CRAZY_RACER_CONTRACT to Vercel env and redeploy.');
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

  const handleMintNicknameClick = useCallback(() => {
    setNickError('');
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNickError('Nickname must be 2–20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setNickError('Only letters, numbers and underscore');
      return;
    }
    setShowNickMintConfirm(true);
  }, [nickname]);

  const handleMintNicknameConfirm = useCallback(() => {
    const trimmed = nickname.trim();
    if (trimmed.length >= 2 && trimmed.length <= 20) {
      mintNickname(trimmed);
      setShowNickMintConfirm(false);
    }
  }, [nickname, mintNickname]);

  const effectiveNickname = baseUser
    ? (baseUser.displayName || baseUser.username || 'Player')
    : nickContractDeployed && hasNickname && contractNickname
      ? contractNickname
      : nickname.trim() || 'Player';

  const effectiveAvatar = baseUser?.pfpUrl || avatar;

  const canPlay = ownedCarIds.has(selectedCarId) && (
    !!baseUser || !nickContractDeployed || hasNickname
  );

  const checkInMultiplier = streak >= 25 ? 1.5 : streak >= 10 ? 1.25 : 1;
  const isFifthRace = bonusDeployed && totalGames > 0 && totalGames % 5 === 4;

  const handlePlay = useCallback(() => {
    setNickError('');
    if (isFifthRace) {
      setShowBonusModal(true);
      triggerBonus();
      return;
    }
    onPlay(selectedCarId, effectiveNickname, effectiveAvatar || undefined, { checkInMultiplier });
  }, [effectiveNickname, effectiveAvatar, selectedCarId, onPlay, isFifthRace, triggerBonus, checkInMultiplier]);

  const handleBonusModalPlay = useCallback(() => {
    setShowBonusModal(false);
    onPlay(selectedCarId, effectiveNickname, effectiveAvatar || undefined, { bonusRace: true, checkInMultiplier });
  }, [selectedCarId, effectiveNickname, effectiveAvatar, onPlay, checkInMultiplier]);

  return (
    <div className="main-menu">
      {!isConnected ? (
        <div className="welcome-overlay">
          <h1 className="welcome-title">Tokyo JDM</h1>
          <p className="welcome-text">Connect your wallet to play</p>
          {connectors.length > 0 && (
            <div className="welcome-connect">
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
        </div>
      ) : (
        <>
      {address && (
        <div className="main-menu-wallet">
          <span>
            {baseUser
              ? (baseUser.displayName || baseUser.username || 'Connected')
              : (contractNickname || nickname?.trim() || 'Connected')}
          </span>
          <button type="button" className="link-btn" onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      )}

      <h1 className="main-menu-title">Tokyo JDM</h1>

      <div className="main-menu-nick">
        {baseUser ? (
          <div className="main-menu-nick-display">
            <span className="main-menu-nick-label">Nickname:</span>
            <span className="main-menu-nick-value">{baseUser.displayName || baseUser.username || '—'}</span>
          </div>
        ) : nickContractDeployed && hasNickname ? (
          <div className="main-menu-nick-display">
            <span className="main-menu-nick-label">Nickname:</span>
            <span className="main-menu-nick-value">{contractNickname || '—'}</span>
          </div>
        ) : nickContractDeployed ? (
          <>
            <input
              type="text"
              className="main-menu-input"
              placeholder="Nickname (2–20 chars)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
            <button type="button" className="menu-btn small mint-free" onClick={handleMintNicknameClick} disabled={mintNickPending}>
              {mintNickPending ? 'MINTING…' : 'MINT NICKNAME'}
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {nickError && <p className="main-menu-error">{nickError}</p>}

      <div className="main-menu-avatar-wrap">
        <span className="main-menu-avatar-label">Avatar</span>
        {baseUser?.pfpUrl ? (
          <div className="main-menu-avatar-circle main-menu-avatar-pfp" title={baseUser.displayName || baseUser.username}>
            <img src={baseUser.pfpUrl} alt="" referrerPolicy="no-referrer" />
          </div>
        ) : (
        <button
          type="button"
          className="main-menu-avatar-circle"
          onClick={() => setShowAvatarPicker((v) => !v)}
          title="Нажми, чтобы сменить"
        >
          <span className="main-menu-avatar-emoji">{avatar}</span>
        </button>
        )}
        {!baseUser && showAvatarPicker && (
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

      {/* Реворды за заезд (Tokens + Withdraw) отключены. См. useScoreRewardClaim, tokenBalanceWei, fetchTokenBalance. */}

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
              {!ownedCarIds.has(selectedCarId)
                ? 'Mint this car first to drive'
                : nickContractDeployed && !hasNickname
                  ? 'Mint nickname first to play'
                  : 'Mint this car first to drive'}
            </p>
          </div>
        )}
        {checkInDeployed && isConnected && (
          <button
            type="button"
            className="menu-btn check-in-btn"
            onClick={() => checkIn()}
            disabled={!canCheckInToday || checkInPending}
          >
            {checkInPending ? '…' : canCheckInToday ? 'Check-in' : `Streak ${streak}`}
          </button>
        )}
      </div>

      {showBonusModal && (
        <div className="menu-overlay" onClick={() => {}}>
          <div className="menu-panel bonus-modal" onClick={(e) => e.stopPropagation()}>
            {!bonusSuccess ? (
              <>
                <p className="bonus-modal-text">Waiting for confirmation…</p>
                {bonusPending && <div className="bonus-modal-spinner" />}
              </>
            ) : (
              <button type="button" className="menu-btn play-btn" onClick={handleBonusModalPlay}>
                PLAY
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav
        activeTab={navTab}
        onTab={(tab) => setNavTab(tab)}
      />

      {navTab === 'howto' && (
        <HowToPlayPopup onClose={() => setNavTab(null)} />
      )}
      {navTab === 'leaderboard' && (
        <Leaderboard
          onClose={() => {
            refreshRecord();
            setNavTab(null);
          }}
          currentAddress={address ?? undefined}
        />
      )}
      {navTab === 'profile' && (
        <Profile
          onClose={() => setNavTab(null)}
          nickname={effectiveNickname}
          avatar={effectiveAvatar}
          address={address ?? undefined}
          bestScore={record}
          chainId={chainId}
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
              onMintFree={handleMintFree}
              onMintPaid={handleMintPaid}
              onPrevCar={() => setBrowsedCarId((prev) => Math.max(0, prev - 1))}
              onNextCar={() => setBrowsedCarId((prev) => Math.min(CARS.length - 1, prev + 1))}
              mintingCarId={mintingCarId}
            />
            <button type="button" className="menu-btn" onClick={() => setNavTab(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}
      {showNickMintConfirm && (
        <div className="menu-overlay" onClick={() => setShowNickMintConfirm(false)}>
          <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-title">Confirm nickname mint</h2>
            <p className="nick-mint-warning">
              You can mint a nickname only once per wallet. It cannot be changed or transferred later.
            </p>
            <p className="nick-mint-preview">Nickname: <strong>{nickname.trim()}</strong></p>
            <div className="nick-mint-actions">
              <button type="button" className="menu-btn" onClick={handleMintNicknameConfirm} disabled={mintNickPending}>
                {mintNickPending ? 'MINTING…' : 'CONFIRM'}
              </button>
              <button type="button" className="menu-btn secondary" onClick={() => setShowNickMintConfirm(false)} disabled={mintNickPending}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
