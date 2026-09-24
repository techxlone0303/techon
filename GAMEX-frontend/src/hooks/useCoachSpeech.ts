import { useState, useEffect, useRef, useCallback } from "react";

export interface CoachSpeechOptions {
  rate?: number;       // Pacing: 0.8 - 1.2 (default 1.05 for confident coaching)
  pitch?: number;      // Tone: 0.8 - 1.2 (default 0.95 for authoritative tone)
  volume?: number;     // Volume: 0.0 - 1.0 (default 1.0)
  lang?: string;       // Preferred language (default 'en-US')
  onPointChange?: (index: number, text: string) => void;
  onComplete?: () => void;
}

export interface CoachSpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentPointIndex: number;
  currentPointText: string;
  progress: number; // 0 - 100 percentage
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipToPoint: (index: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

/**
 * Custom React Hook: useCoachSpeech
 * Sequentially narrates an array of esports coaching points using the browser's Web Speech API.
 * Features automatic voice selection, avatar coaching cadence, and unmount cancellation.
 */
export function useCoachSpeech(
  coachingPoints: string[] = [],
  options: CoachSpeechOptions = {}
): CoachSpeechState {
  const {
    rate = 1.05,
    pitch = 0.95,
    volume = 1.0,
    lang = "en-US",
    onPointChange,
    onComplete,
  } = options;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(-1);

  // Keep latest refs to avoid stale closures in speech event handlers
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pointsRef = useRef<string[]>(coachingPoints);
  const indexRef = useRef<number>(-1);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    pointsRef.current = coachingPoints;
  }, [coachingPoints]);

  // 1. Voice Loading & Selection
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("[Speech] Web Speech API is not supported in this browser.");
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices && availableVoices.length > 0) {
        setVoices(availableVoices);

        // Pick optimal coaching voice: prefer natural/fluent English voices
        const preferred =
          availableVoices.find(
            (v) =>
              (v.name.includes("Google") ||
                v.name.includes("Natural") ||
                v.name.includes("David") ||
                v.name.includes("Daniel") ||
                v.name.includes("Samantha")) &&
              v.lang.startsWith("en")
          ) ||
          availableVoices.find((v) => v.lang.startsWith("en")) ||
          availableVoices[0];

        setSelectedVoice(preferred || null);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 2. Play Single Coaching Point
  const speakPoint = useCallback(
    (index: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!pointsRef.current || index < 0 || index >= pointsRef.current.length) {
        // All points completed
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentPointIndex(-1);
        indexRef.current = -1;
        isPlayingRef.current = false;
        onComplete?.();
        return;
      }

      window.speechSynthesis.cancel();

      const text = pointsRef.current[index];
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.lang = lang;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentPointIndex(index);
        indexRef.current = index;
        isPlayingRef.current = true;
        onPointChange?.(index, text);
      };

      utterance.onend = () => {
        if (!isPlayingRef.current) return;
        // Advance to next point automatically
        const nextIndex = index + 1;
        if (nextIndex < pointsRef.current.length) {
          // Small tactical pause between directives
          setTimeout(() => {
            if (isPlayingRef.current) {
              speakPoint(nextIndex);
            }
          }, 350);
        } else {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentPointIndex(-1);
          indexRef.current = -1;
          isPlayingRef.current = false;
          onComplete?.();
        }
      };

      utterance.onerror = (e) => {
        // Ignore interrupted event caused by intentional .cancel()
        if (e.error === "interrupted" || e.error === "canceled") return;
        console.warn("[Speech] Utterance error:", e.error);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice, rate, pitch, volume, lang, onPointChange, onComplete]
  );

  // 3. User Controls
  const start = useCallback(() => {
    if (!pointsRef.current || pointsRef.current.length === 0) return;
    isPlayingRef.current = true;
    speakPoint(0);
  }, [speakPoint]);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else if (!isSpeaking && pointsRef.current.length > 0) {
        start();
      }
    }
  }, [isSpeaking, start]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      isPlayingRef.current = false;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentPointIndex(-1);
      indexRef.current = -1;
    }
  }, []);

  const skipToPoint = useCallback(
    (index: number) => {
      if (index >= 0 && index < pointsRef.current.length) {
        isPlayingRef.current = true;
        speakPoint(index);
      }
    },
    [speakPoint]
  );

  // 4. Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        isPlayingRef.current = false;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentPointText =
    currentPointIndex >= 0 && currentPointIndex < coachingPoints.length
      ? coachingPoints[currentPointIndex]
      : "";

  const progress =
    coachingPoints.length > 0 && currentPointIndex >= 0
      ? Math.round(((currentPointIndex + 1) / coachingPoints.length) * 100)
      : 0;

  return {
    isSpeaking,
    isPaused,
    currentPointIndex,
    currentPointText,
    progress,
    voices,
    selectedVoice,
    start,
    pause,
    resume,
    stop,
    skipToPoint,
    setVoice: setSelectedVoice,
  };
}
