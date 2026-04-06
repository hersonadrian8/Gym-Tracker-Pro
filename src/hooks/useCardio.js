import { useState, useMemo, useCallback } from "react";
import { CARDIO_DB } from "../constants";
import { toLocalISO } from "../utils/helpers";

export function useCardio(cardioHistory, setCardioHistory, customCardio, setCustomCardio) {
  const [showCardioLog, setShowCardioLog] = useState(false);
  const [cardioType, setCardioType] = useState("");
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioDistUnit, setCardioDistUnit] = useState("mi");
  const [cardioTime, setCardioTime] = useState("");
  const [cardioSearch, setCardioSearch] = useState("");
  const [cardioProgressType, setCardioProgressType] = useState("");
  const [cardioProgressMetric, setCardioProgressMetric] = useState("distance");

  const allCardioTypes = useMemo(
    () => [...new Set([...CARDIO_DB, ...customCardio])].sort(),
    [customCardio]
  );

  const saveCardioSession = useCallback(() => {
    if (!cardioType.trim()) return;
    const now = new Date();
    const d = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const iso = toLocalISO(now);
    const dist = parseFloat(cardioDistance) || 0;
    const mins = parseFloat(cardioTime) || 0;
    if (!dist && !mins) return;
    const entry = { type: cardioType.trim(), date: d, isoDate: iso, distance: dist, unit: cardioDistUnit, time: mins, pace: dist > 0 && mins > 0 ? +(mins / dist).toFixed(2) : 0 };
    if (!CARDIO_DB.includes(cardioType.trim()) && !customCardio.includes(cardioType.trim())) {
      setCustomCardio(prev => [...prev, cardioType.trim()]);
    }
    setCardioHistory(prev => [...prev, entry]);
    setShowCardioLog(false); setCardioType(""); setCardioDistance(""); setCardioTime(""); setCardioSearch("");
  }, [cardioType, cardioDistance, cardioDistUnit, cardioTime, customCardio, setCardioHistory, setCustomCardio]);

  const getCardioData = useCallback((type, metric) =>
    cardioHistory.filter(c => c.type === type).map(c => ({
      date: c.date,
      value: metric === "distance" ? c.distance : metric === "time" ? c.time : c.pace,
      isoDate: c.isoDate,
    })),
    [cardioHistory]
  );

  const getCardioBest = useCallback((type, metric) => {
    const entries = cardioHistory.filter(c => c.type === type && c[metric] > 0);
    if (!entries.length) return 0;
    return metric === "pace" ? Math.min(...entries.map(e => e.pace)) : Math.max(...entries.map(e => e[metric]));
  }, [cardioHistory]);

  const getLastCardio = useCallback(() => {
    if (!cardioHistory.length) return null;
    const sorted = [...cardioHistory].sort((a, b) => (b.isoDate || "0").localeCompare(a.isoDate || "0"));
    return sorted[0];
  }, [cardioHistory]);

  return {
    showCardioLog, setShowCardioLog,
    cardioType, setCardioType,
    cardioDistance, setCardioDistance,
    cardioDistUnit, setCardioDistUnit,
    cardioTime, setCardioTime,
    cardioSearch, setCardioSearch,
    cardioProgressType, setCardioProgressType,
    cardioProgressMetric, setCardioProgressMetric,
    allCardioTypes, saveCardioSession,
    getCardioData, getCardioBest, getLastCardio,
  };
}
