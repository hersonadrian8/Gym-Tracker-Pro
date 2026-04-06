import { useState, useRef, useEffect, useCallback } from "react";

export function useRestTimer() {
  const [rSecs, setRSecs] = useState(0);
  const [rTotal, setRTotal] = useState(0);
  const [rActive, setRActive] = useState(false);
  const [rAfterEx, setRAfterEx] = useState(null);
  const [rAfterSet, setRAfterSet] = useState(null);
  const [rStartTime, setRStartTime] = useState(null);
  const rRef = useRef(null);

  const stopR = useCallback(() => {
    if (rRef.current) clearInterval(rRef.current);
    setRActive(false);
    setRSecs(0);
    setRTotal(0);
    setRStartTime(null);
    setRAfterEx(null);
    setRAfterSet(null);
  }, []);

  const startR = useCallback((s, exIdx, setIdx) => {
    if (rRef.current) clearInterval(rRef.current);
    setRTotal(s);
    setRStartTime(Date.now());
    setRActive(true);
    setRAfterEx(exIdx);
    setRAfterSet(setIdx);
  }, []);

  useEffect(() => {
    if (rActive && rStartTime && rTotal > 0) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - rStartTime) / 1000);
        setRSecs(rTotal - elapsed);
      };
      tick();
      rRef.current = setInterval(tick, 1000);
      return () => clearInterval(rRef.current);
    }
  }, [rActive, rStartTime, rTotal]);

  const rProg = rTotal > 0 ? Math.max(0, 1 - rSecs / rTotal) : 0;
  const isOvertime = rSecs < 0;

  return { rSecs, rTotal, rActive, rAfterEx, rAfterSet, rProg, isOvertime, startR, stopR };
}
