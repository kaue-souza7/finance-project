import { useCallback, useRef } from "react";
import confetti from "canvas-confetti";

interface UseConfettiOptions {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function useConfetti({ buttonRef }: UseConfettiOptions) {
  const lastFiredAt = useRef(0);

  const fire = useCallback(() => {
    const now = Date.now();
    if (now - lastFiredAt.current < 1000) return;

    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    lastFiredAt.current = now;

    confetti({
      particleCount: 12,
      spread: 35,
      startVelocity: 18,
      gravity: 0.8,
      ticks: 70,
      origin: { x, y },
      colors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24"],
      disableForReducedMotion: true,
      zIndex: 50,
    });
  }, [buttonRef]);

  return { fire };
}
