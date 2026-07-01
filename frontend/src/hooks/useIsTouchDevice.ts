import { useState } from "react";

function detectTouch(): boolean {
  if (typeof window === "undefined") return false;
  return (
    matchMedia("(hover: none) and (pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0
  );
}

export function useIsTouchDevice(): boolean {
  const [isTouch] = useState(detectTouch);
  return isTouch;
}
