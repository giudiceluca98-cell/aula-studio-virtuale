"use client";

import { useCallback, useEffect, useRef } from "react";

const RING_INTERVAL_MS = 2_200;
const BURST_DURATION_SECONDS = 0.42;
const SECOND_BURST_DELAY_SECONDS = 0.56;

type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function audioContextConstructor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext ?? null;
}

export function useIncomingCallRingtone(ringing: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const oscillatorsRef = useRef(new Set<OscillatorNode>());

  const stopRingtone = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    for (const oscillator of oscillatorsRef.current) {
      oscillator.onended = null;
      try { oscillator.stop(); } catch { /* The scheduled tone has already stopped. */ }
    }
    oscillatorsRef.current.clear();
  }, []);

  const playBurst = useCallback((context: AudioContext, startsAt: number) => {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startsAt + 0.025);
    gain.gain.setValueAtTime(0.12, startsAt + BURST_DURATION_SECONDS - 0.055);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + BURST_DURATION_SECONDS);
    gain.connect(context.destination);

    for (const frequency of [440, 480]) {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startsAt);
      oscillator.connect(gain);
      oscillatorsRef.current.add(oscillator);
      oscillator.onended = () => oscillatorsRef.current.delete(oscillator);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + BURST_DURATION_SECONDS);
    }
  }, []);

  const playRing = useCallback((context: AudioContext) => {
    const startsAt = context.currentTime + 0.03;
    playBurst(context, startsAt);
    playBurst(context, startsAt + SECOND_BURST_DELAY_SECONDS);
  }, [playBurst]);

  useEffect(() => {
    if (!ringing) {
      stopRingtone();
      return;
    }

    let cancelled = false;
    const startRingtone = async () => {
      const Context = audioContextConstructor();
      if (!Context || cancelled || intervalRef.current !== null) return;
      const context = contextRef.current ?? new Context();
      contextRef.current = context;
      try {
        if (context.state === "suspended") await context.resume();
      } catch { /* A later user gesture can unlock audio playback. */ }
      if (cancelled || context.state !== "running" || intervalRef.current !== null) return;
      playRing(context);
      intervalRef.current = window.setInterval(() => playRing(context), RING_INTERVAL_MS);
    };

    const unlockAudio = () => { void startRingtone(); };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    void startRingtone();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      stopRingtone();
    };
  }, [playRing, ringing, stopRingtone]);

  useEffect(() => () => {
    stopRingtone();
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, [stopRingtone]);
}
