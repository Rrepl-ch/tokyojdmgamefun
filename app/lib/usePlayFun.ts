'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { loadPlayFunScript, isPlayFunConfigured, type OpenGameSDKInstance } from './playfun';

const gameId = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_PLAYFUN_GAME_ID ?? '') : '';

export function usePlayFun() {
  const [isReady, setIsReady] = useState(false);
  const instanceRef = useRef<OpenGameSDKInstance | null>(null);

  useEffect(() => {
    if (!isPlayFunConfigured() || !gameId) return;
    let cancelled = false;
    loadPlayFunScript()
      .then(() => {
        if (cancelled || typeof window === 'undefined' || !window.OpenGameSDK) return;
        const ogp = new window.OpenGameSDK({
          ui: { usePointsWidget: true, theme: 'dark' },
          logLevel: 'warn',
        });
        ogp.on('OnReady', () => {
          if (!cancelled) {
            instanceRef.current = ogp;
            setIsReady(true);
          }
        });
        ogp.init({ gameId });
      })
      .catch(() => {
        if (!cancelled) setIsReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getPoints = useCallback(async (): Promise<number> => {
    const ogp = instanceRef.current;
    if (!ogp) return 0;
    try {
      const result = await ogp.getPoints();
      const pts = result?.points;
      return typeof pts === 'number' ? pts : 0;
    } catch {
      return 0;
    }
  }, []);

  const addPoints = useCallback((amount: number) => {
    if (amount <= 0) return;
    const ogp = instanceRef.current;
    if (!ogp) return;
    try {
      ogp.addPoints(amount);
    } catch {
      // ignore
    }
  }, []);

  const endGame = useCallback(async (): Promise<void> => {
    const ogp = instanceRef.current;
    if (!ogp) return;
    try {
      await ogp.endGame();
    } catch {
      // ignore
    }
  }, []);

  return { isReady, getPoints, addPoints, endGame };
}
