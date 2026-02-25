'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './game.css';
import { MainMenu } from './components/MainMenu';
import { getCarById } from '@/app/types/cars';
import { getOrCreateGuestId } from '@/app/lib/guestId';
import { usePlayFun } from '@/app/lib/usePlayFun';

type Car = {
  x: number;
  y: number;
  lane: number;
  isOpp: boolean;
  passed: boolean;
  targetLane: number;
  blinkDir: number;
  blinkTimer: number;
  spriteIndex: number;
};

const ROAD_X = 50;
const ROAD_WIDTH = 300;
const LANES = 6;
const LANE_WIDTH = ROAD_WIDTH / LANES;
const SAME_DIR_LANES = [0, 1, 2];
const OPP_DIR_LANES = [3, 4, 5];
const OPP_CHANCE = 0.5;
const CHANGE_CHANCE = 0.2;
const SPEED_STEP = 0.6;
const MAX_SPEED = 6;
const laneCenters = Array.from({ length: LANES }, (_, i) => ROAD_X + LANE_WIDTH * (i + 0.5));

export default function GamePage() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [gameCarId, setGameCarId] = useState(0);
  const [gameNickname, setGameNickname] = useState('');
  const [gameAvatar, setGameAvatar] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [nickname, setNickname] = useState('');

  const imagesRef = useRef<{
    player: HTMLImageElement | null;
    playerSprite: string;
    sameCars: (HTMLImageElement | null)[];
    oppCars: (HTMLImageElement | null)[];
    shoulder: HTMLImageElement | null;
    asphalt: HTMLImageElement | null;
    tunnelBg: HTMLImageElement | null;
    neon: HTMLImageElement | null;
    centerLine: HTMLImageElement | null;
    laneLine: HTMLImageElement | null;
  }>({
    player: null,
    playerSprite: '',
    sameCars: [],
    oppCars: [],
    shoulder: null,
    asphalt: null,
    tunnelBg: null,
    neon: null,
    centerLine: null,
    laneLine: null,
  });

  const carsRef = useRef<Car[]>([]);
  const linesRef = useRef<Array<{ x: number; y: number }>>([]);
  const neonsRef = useRef<Array<{ x: number; y: number; color: string }>>([]);
  const shoulderStreaksRef = useRef<Array<{ x: number; y: number; h: number; color: string }>>([]);
  const gameLoopRef = useRef<number | null>(null);
  const mousePosRef = useRef(200);
  const lastLaneSameRef = useRef<number | null>(null);
  const lastLaneOppRef = useRef<number | null>(null);
  const carSpawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedIncreaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreMultiplierRef = useRef(1);
  const playerPlaceholderColorRef = useRef('#00a8ff');
  const leaderboardSubmittedRef = useRef(false);
  const gameStartTimeRef = useRef<number>(0);
  const tabVisibleRef = useRef(true);
  const pausedRef = useRef(false);
  const passedCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number>(0);
  const playFun = usePlayFun();
  const playFunBestRef = useRef(0);
  const playFunBestFetchedRef = useRef(false);
  const playFunSubmittedRef = useRef(false);

  const createImage = (): HTMLImageElement => {
    if (typeof window !== 'undefined') return new Image();
    return {} as HTMLImageElement;
  };

  useEffect(() => {
    const images = imagesRef.current;
    if (typeof window !== 'undefined') {
      images.player = createImage();
      images.sameCars = Array.from({ length: 5 }, () => createImage());
      images.oppCars = Array.from({ length: 5 }, () => createImage());
      images.shoulder = createImage();
      images.asphalt = createImage();
      images.tunnelBg = createImage();
      images.neon = createImage();
      images.centerLine = createImage();
      images.laneLine = createImage();
    }
    let loadedCount = 0;
    const totalImages = 17;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) setImagesLoaded(true);
    };
    if (images.player) {
      images.player.src = '/cars/player.png';
      images.player.onload = checkAllLoaded;
      images.player.onerror = () => checkAllLoaded();
    }
    images.sameCars.forEach((img, i) => {
      if (img) {
        img.src = `/cars/same${i + 1}.png`;
        img.onload = checkAllLoaded;
        img.onerror = () => checkAllLoaded();
      }
    });
    images.oppCars.forEach((img, i) => {
      if (img) {
        img.src = `/cars/opp${i + 1}.png`;
        img.onload = checkAllLoaded;
        img.onerror = () => checkAllLoaded();
      }
    });
    const loadRoad = (img: HTMLImageElement | null, path: string) => {
      if (img) {
        img.src = path;
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded;
      }
    };
    loadRoad(images.shoulder, '/road/shoulder.png');
    loadRoad(images.asphalt, '/road/asphalt.png');
    loadRoad(images.tunnelBg, '/road/tunnel-bg.png');
    loadRoad(images.neon, '/ui/neon-light.png');
    loadRoad(images.centerLine, '/road/center-line.png');
    loadRoad(images.laneLine, '/road/lane-line.png');
    setTimeout(() => {
      if (loadedCount < totalImages) setImagesLoaded(true);
    }, 3000);
  }, []);

  const submitScore = useCallback(async (finalScore: number, carId: number, nick: string, avatarOverride?: string, durationMs?: number) => {
    if (leaderboardSubmittedRef.current || !nick.trim()) return;
    const playerId = typeof window !== 'undefined' ? getOrCreateGuestId() : '';
    if (!playerId) return;
    leaderboardSubmittedRef.current = true;
    const avatar = avatarOverride ?? (typeof window !== 'undefined' ? (localStorage.getItem('crazy_racer_avatar') || '😎') : '😎');
    const duration = durationMs ?? (gameStartTimeRef.current > 0 ? Math.max(0, Date.now() - gameStartTimeRef.current) : 0);
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nick.trim(),
          score: Math.floor(finalScore),
          playerId,
          carId,
          avatar,
          durationMs: duration,
        }),
      });
    } catch {
      // ignore
    }
  }, []);

  const startGame = useCallback((
    carId: number,
    nick: string,
    avatar?: string,
    options?: { bonusRace?: boolean; checkInMultiplier?: number }
  ) => {
    setGameCarId(carId);
    setGameNickname(nick);
    setGameAvatar(avatar ?? '');
    const car = getCarById(carId);
    const base = car?.scoreMultiplier ?? 1;
    const checkIn = options?.checkInMultiplier ?? 1;
    const bonus = options?.bonusRace ? 2.5 : 1;
    scoreMultiplierRef.current = base * checkIn * bonus;
    playerPlaceholderColorRef.current = car?.placeholderColor ?? '#00a8ff';
    if (imagesRef.current.player && car?.sprite) {
      imagesRef.current.player.src = car.sprite;
      imagesRef.current.playerSprite = car.sprite;
    } else {
      imagesRef.current.playerSprite = '';
    }
    setScreen('game');
    setScore(0);
    setSpeed(1.5);
    gameStartTimeRef.current = Date.now();
    carsRef.current = [];
    linesRef.current = [];
    neonsRef.current = [];
    shoulderStreaksRef.current = [];
    lastLaneSameRef.current = null;
    lastLaneOppRef.current = null;
    leaderboardSubmittedRef.current = false;
    passedCountRef.current = 0;
    mousePosRef.current = laneCenters[1];
    playFunBestFetchedRef.current = false;
    playFunSubmittedRef.current = false;
    setGameActive(true);
    setIsPaused(false);
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setSpeed(1.5);
    carsRef.current = [];
    linesRef.current = [];
    neonsRef.current = [];
    shoulderStreaksRef.current = [];
    lastLaneSameRef.current = null;
    lastLaneOppRef.current = null;
    leaderboardSubmittedRef.current = false;
    passedCountRef.current = 0;
    mousePosRef.current = laneCenters[1];
    setGameActive(true);
    setIsPaused(false);
  }, []);

  const [menuKey, setMenuKey] = useState(0);
  const backToMenu = useCallback(() => {
    setGameActive(false);
    setScreen('menu');
    setMenuKey((k) => k + 1);
  }, []);

  const onNicknameSubmit = useCallback(async (): Promise<boolean> => {
    return true;
  }, []);

  useEffect(() => {
    if (screen !== 'game' || !gameActive || !canvasRef.current || !imagesLoaded) return;
    lastFrameTimeRef.current = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const images = imagesRef.current;

    const onVisibility = () => {
      tabVisibleRef.current = typeof document !== 'undefined' && document.visibilityState !== 'hidden';
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);

    if (linesRef.current.length === 0) {
      const dashGap = 160;
      [1, 2, 4, 5].forEach((laneIndex) => {
        const lineX = ROAD_X + laneIndex * LANE_WIDTH;
        for (let y = 0; y < 600; y += dashGap) linesRef.current.push({ x: lineX, y });
      });
    }
    const neonColors = ['#00a8ff', '#ff0066', '#00ffcc', '#ffaa00', '#aa66ff'];
    if (neonsRef.current.length === 0) {
      for (let i = 0; i < 28; i++) {
        neonsRef.current.push({
          x: Math.random() < 0.5 ? 12 + Math.random() * 20 : 368 + Math.random() * 20,
          y: Math.random() * 700,
          color: neonColors[i % neonColors.length],
        });
      }
    }
    if (shoulderStreaksRef.current.length === 0) {
      for (let i = 0; i < 24; i++) {
        const left = Math.random() < 0.5;
        shoulderStreaksRef.current.push({
          x: left ? 8 + Math.random() * 25 : 367 + Math.random() * 25,
          y: Math.random() * 800,
          h: 40 + Math.random() * 80,
          color: neonColors[i % neonColors.length],
        });
      }
    }

    const drawRoad = () => {
      if (images.tunnelBg?.complete && images.tunnelBg.naturalWidth > 0) {
        ctx.drawImage(images.tunnelBg, 0, 0, 400, 600);
      } else {
        ctx.fillStyle = '#0f0f12';
        ctx.fillRect(0, 0, 400, 600);
      }
      if (images.shoulder?.complete && images.shoulder.naturalWidth > 0) {
        for (let y = 0; y < 600; y += 50) {
          ctx.drawImage(images.shoulder, 25, y, 50, 50);
          ctx.drawImage(images.shoulder, 325, y, 50, 50);
        }
      } else {
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(25, 0, 50, 600);
        ctx.fillRect(325, 0, 50, 600);
      }
      if (images.asphalt?.complete && images.asphalt.naturalWidth > 0) {
        for (let y = 0; y < 600; y += 100) {
          for (let x = ROAD_X; x < ROAD_X + ROAD_WIDTH; x += 100) {
            ctx.drawImage(images.asphalt, x, y, 100, 100);
          }
        }
      } else {
        ctx.fillStyle = '#252528';
        ctx.fillRect(ROAD_X, 0, ROAD_WIDTH, 600);
      }
    };

    const drawLines = (dtScale: number) => {
      if (images.laneLine?.complete && images.laneLine.naturalWidth > 0) {
        linesRef.current = linesRef.current.map((line) => {
          const newY = line.y + speed * 4 * dtScale;
          ctx.drawImage(images.laneLine!, line.x - 2, newY, 4, 90);
          return { x: line.x, y: newY > 660 ? -80 : newY };
        });
      } else {
        ctx.fillStyle = '#cccccc';
        linesRef.current = linesRef.current.map((line) => {
          const newY = line.y + speed * 4 * dtScale;
          ctx.fillRect(line.x - 2, newY, 4, 90);
          return { x: line.x, y: newY > 660 ? -80 : newY };
        });
      }
      if (images.centerLine?.complete && images.centerLine.naturalWidth > 0) {
        ctx.drawImage(images.centerLine, ROAD_X + LANE_WIDTH * 3 - 6, 0, 3, 600);
        ctx.drawImage(images.centerLine, ROAD_X + LANE_WIDTH * 3 + 6, 0, 3, 600);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ROAD_X + LANE_WIDTH * 3 - 6, 0, 3, 600);
        ctx.fillRect(ROAD_X + LANE_WIDTH * 3 + 6, 0, 3, 600);
      }
    };

    const drawNeons = (dtScale: number) => {
      const moveY = speed * 3.5 * dtScale;
      neonsRef.current = neonsRef.current.map((n) => {
        const newY = n.y + moveY;
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(n.x, newY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        return { ...n, y: newY > 650 ? -30 : newY };
      });
      shoulderStreaksRef.current = shoulderStreaksRef.current.map((s) => {
        const newY = s.y + moveY;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(s.x - 2, newY, 4, s.h);
        ctx.shadowBlur = 0;
        return { ...s, y: newY > 700 ? -s.h : newY };
      });
    };

    const drawPlayer = () => {
      const x = mousePosRef.current;
      const y = 520;
      const pw = 52;
      const ph = 45;
      if (images.playerSprite && images.player?.complete && images.player.naturalWidth > 0) {
        ctx.drawImage(images.player, x - pw / 2, y - ph / 2, pw, ph);
      } else {
        ctx.fillStyle = playerPlaceholderColorRef.current;
        ctx.shadowColor = playerPlaceholderColorRef.current;
        ctx.shadowBlur = 6;
        ctx.fillRect(x - pw / 2, y - ph / 2, pw, ph);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - pw / 2, y - ph / 2, pw, ph);
      }
    };

    const drawCars = (dtScale: number) => {
      carsRef.current = carsRef.current
        .map((car) => {
          const speedMult = car.isOpp ? 6 : 3;
          const newY = car.y + speed * speedMult * dtScale;
          let newX = car.x;
          let newLane = car.lane;
          let newBlinkDir = car.blinkDir;
          const newBlinkTimer = car.blinkTimer + 1;
          if (car.targetLane !== car.lane) {
            const targetX = laneCenters[car.targetLane];
            newX += (targetX - car.x) * 0.05 * dtScale;
            if (Math.abs(newX - targetX) < 1) {
              newLane = car.targetLane;
              newBlinkDir = 0;
            }
          }
          const carImages = car.isOpp ? images.oppCars : images.sameCars;
          const sprite = carImages[car.spriteIndex % carImages.length];
          if (sprite?.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, newX - 19, newY - 18, 38, 37);
          } else {
            ctx.fillStyle = car.isOpp ? '#ff3355' : '#22cc88';
            ctx.fillRect(newX - 19, newY - 18, 38, 37);
          }
          let newPassed = car.passed;
          if (!car.passed && newY > 520 && !car.isOpp) {
            newPassed = true;
            passedCountRef.current += 1;
            setScore((prev) => prev + scoreMultiplierRef.current);
          }
          const playerX = mousePosRef.current;
          const playerY = 520;
          const phw = 26;
          const phh = 23;
          const collision =
            playerX - phw < newX + 11 &&
            playerX + phw > newX - 11 &&
            playerY - phh < newY + 10 &&
            playerY + phh > newY - 10;
          if (collision) setGameActive(false);
          return newY > 650
            ? null
            : {
                ...car,
                x: newX,
                y: newY,
                lane: newLane,
                passed: newPassed,
                blinkDir: newBlinkDir,
                blinkTimer: newBlinkTimer,
              };
        })
        .filter(Boolean) as Car[];
    };

    const spawnCars = () => {
      if (!tabVisibleRef.current || pausedRef.current) return;
      const count = Math.floor(Math.random() * 2) + 1;
      const usedSame = new Set<number>();
      const usedOpp = new Set<number>();
      for (let i = 0; i < count; i++) {
        const isOpp = Math.random() < OPP_CHANCE;
        const lanes = isOpp ? OPP_DIR_LANES : SAME_DIR_LANES;
        let lane: number;
        let attempts = 0;
        do {
          lane = lanes[Math.floor(Math.random() * lanes.length)];
          attempts++;
        } while (
          (isOpp && (lane === lastLaneOppRef.current || usedOpp.has(lane))) ||
          (!isOpp && (lane === lastLaneSameRef.current || usedSame.has(lane)))
        );
        if (attempts >= 10) continue;
        if (isOpp) {
          lastLaneOppRef.current = lane;
          usedOpp.add(lane);
        } else {
          lastLaneSameRef.current = lane;
          usedSame.add(lane);
        }
        const x = laneCenters[lane];
        let targetLane = lane;
        let blinkDir = 0;
        if (Math.random() < CHANGE_CHANCE) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const minLane = isOpp ? 3 : 0;
          const maxLane = isOpp ? 5 : 2;
          const newLane = Math.max(minLane, Math.min(maxLane, lane + dir));
          if (newLane !== lane) {
            targetLane = newLane;
            blinkDir = newLane > lane ? 1 : -1;
          }
        }
        carsRef.current.push({
          x,
          y: -60 - i * 60,
          lane,
          isOpp,
          passed: false,
          targetLane,
          blinkDir,
          blinkTimer: 0,
          spriteIndex: Math.floor(Math.random() * (isOpp ? images.oppCars.length : images.sameCars.length)),
        });
      }
    };

    const gameLoop = () => {
      if (!gameActive) return;
      const now = performance.now();
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = now;
      let dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;
      dt = Math.min(dt, 0.1);
      const dtScale = dt * 60;
      if (!tabVisibleRef.current || pausedRef.current) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      const px = mousePosRef.current;
      const laneIndex = Math.max(0, Math.min(5, Math.round((px - ROAD_X - LANE_WIDTH / 2) / LANE_WIDTH)));
      const onOpposite = laneIndex >= 3;
      const baseDelta = speed * 1.8 * (onOpposite ? 1.5 : 1) * dtScale;
      setScore((prev) => prev + baseDelta * scoreMultiplierRef.current);
      drawRoad();
      drawLines(dtScale);
      drawNeons(dtScale);
      drawPlayer();
      drawCars(dtScale);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    carSpawnIntervalRef.current = setInterval(spawnCars, 700);
    speedIncreaseIntervalRef.current = setInterval(() => {
      setSpeed((prev) => Math.min(prev + SPEED_STEP, MAX_SPEED));
    }, 30000);
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (carSpawnIntervalRef.current) clearInterval(carSpawnIntervalRef.current);
      if (speedIncreaseIntervalRef.current) clearInterval(speedIncreaseIntervalRef.current);
    };
  }, [screen, gameActive, speed, imagesLoaded]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Fetch Play.fun best score when a round starts
  useEffect(() => {
    if (screen !== 'game' || !gameActive || !playFun.isReady || playFunBestFetchedRef.current) return;
    playFunBestFetchedRef.current = true;
    playFun.getPoints().then((best) => {
      playFunBestRef.current = best;
    });
  }, [screen, gameActive, playFun.isReady, playFun.getPoints]);

  useEffect(() => {
    if (!gameActive && screen === 'game' && score > 0) {
      const durationMs = gameStartTimeRef.current > 0 ? Date.now() - gameStartTimeRef.current : 0;
      submitScore(score, gameCarId, gameNickname, gameAvatar || undefined, durationMs);

      // Play.fun: submit improvement over best (endGame opens modal)
      const improvement = Math.floor(score) - playFunBestRef.current;
      if (playFun.isReady && improvement > 0 && !playFunSubmittedRef.current) {
        playFunSubmittedRef.current = true;
        playFun.addPoints(improvement);
        playFun.endGame().then(() => {
          playFunBestRef.current = Math.max(playFunBestRef.current, Math.floor(score));
        });
      }
    }
  }, [gameActive, screen, score, gameCarId, gameNickname, gameAvatar, submitScore, playFun]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || screen !== 'game') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!gameActive) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      const clampedX = Math.max(ROAD_X + 10, Math.min(ROAD_X + ROAD_WIDTH - 10, x));
      mousePosRef.current = clampedX;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!gameActive) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.touches[0].clientX - rect.left) * scaleX;
        const clampedX = Math.max(ROAD_X + 10, Math.min(ROAD_X + ROAD_WIDTH - 10, x));
        mousePosRef.current = clampedX;
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [screen, gameActive]);

  if (!imagesLoaded) {
    return (
      <div className="loading-screen">
        <h2>Loading JDM Assets...</h2>
        <p>Preparing Tokyo Expressway</p>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (screen === 'menu') {
    return (
      <div className="game-container menu-container">
        <MainMenu
          menuKey={menuKey}
          nickname={nickname}
          setNickname={setNickname}
          onNicknameSubmit={onNicknameSubmit}
          onPlay={(carId, nick, avatar) => startGame(carId, nick || 'Player', avatar)}
        />
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="score-display">{Math.floor(score)}</div>
      {gameActive && (
        <button
          type="button"
          className="game-pause-btn"
          onClick={() => setIsPaused((p) => !p)}
          title={isPaused ? 'Resume' : 'Pause'}
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? '▶' : '‖'}
        </button>
      )}
      <canvas ref={canvasRef} width={400} height={600} className="game-canvas" />
      {isPaused && gameActive && (
        <div className="game-pause-overlay">
          <p className="game-pause-text">PAUSED</p>
          <button type="button" className="start-button" onClick={() => setIsPaused(false)}>
            Resume
          </button>
        </div>
      )}
      {!gameActive && (
        <div className="start-screen">
          <h2>Tokyo JDM</h2>
          <p>{Math.floor(score)}</p>
          <button type="button" onClick={resetGame} className="start-button">
            {score > 0 ? 'RESTART' : 'START'}
          </button>
          <button type="button" onClick={backToMenu} className="start-button secondary">
            MENU
          </button>
          {/* Реворды за заезд отключены: {score >= 100000 && <p className="start-screen-tokens-hint">Tokens added to your balance</p>} */}
        </div>
      )}
    </div>
  );
}
