import { useEffect, useState } from "react";
import type { MousePoint } from "./types";

export function useMouseGlow() {
  const [mouse, setMouse] = useState<MousePoint>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    const onLeave = () => setMouse(null);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return { mouse };
}

export default useMouseGlow;
