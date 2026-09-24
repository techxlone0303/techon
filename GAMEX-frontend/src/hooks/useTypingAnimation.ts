import { useState, useEffect, useRef, useCallback } from "react";

export interface TypingAnimationOptions {
  speedMs?: number;        // Milliseconds per character (default: 26ms for avatar pacing)
  isActive?: boolean;      // Whether typing should be actively running
  onComplete?: () => void; // Triggered when full text has been typed
}

export interface TypingAnimationState {
  displayedText: string;
  isTyping: boolean;
  isComplete: boolean;
  progress: number; // 0 - 100 percentage
  completeImmediately: () => void;
  reset: () => void;
}

/**
 * Custom React Hook: useTypingAnimation
 * Renders target text character-by-character in sync with speech playback.
 * Lightweight, zero-dependency state manager with instant-skip and cancellation.
 */
export function useTypingAnimation(
  targetText: string,
  options: TypingAnimationOptions = {}
): TypingAnimationState {
  const { speedMs = 26, isActive = true, onComplete } = options;

  const [charIndex, setCharIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset character index when targetText changes
  useEffect(() => {
    setCharIndex(0);
    setIsTyping(false);
  }, [targetText]);

  // Main typing loop
  useEffect(() => {
    if (!isActive || !targetText) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTyping(false);
      return;
    }

    if (charIndex >= targetText.length) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    setIsTyping(true);

    timerRef.current = setInterval(() => {
      setCharIndex((prev) => {
        if (prev + 1 >= targetText.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTyping(false);
          onComplete?.();
          return targetText.length;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [charIndex, isActive, targetText, speedMs, onComplete]);

  // Instant Reveal
  const completeImmediately = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCharIndex(targetText.length);
    setIsTyping(false);
    onComplete?.();
  }, [targetText, onComplete]);

  // Reset
  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCharIndex(0);
    setIsTyping(false);
  }, []);

  const displayedText = targetText.slice(0, charIndex);
  const isComplete = charIndex >= targetText.length && targetText.length > 0;
  const progress =
    targetText.length > 0 ? Math.round((charIndex / targetText.length) * 100) : 0;

  return {
    displayedText,
    isTyping,
    isComplete,
    progress,
    completeImmediately,
    reset,
  };
}
