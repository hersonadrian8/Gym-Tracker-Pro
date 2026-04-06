import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { syncPerformanceStats, syncCustomExercises, syncAppData, fetchAppData } from "../utils/syncPerformance";
import { EXERCISE_DB } from "../constants";

export function useCloudSync({
  user, programs, history, primaryProgIdx, appearance, customRestTimes,
  favoriteExercises, hiddenExercises, cardioHistory, customCardio, customExercises,
  setPrograms, setHistory, setPrimaryProgIdx, setAppearance, setCustomRestTimes,
  setFavoriteExercises, setHiddenExercises, setCardioHistory, setCustomCardio,
  setCustomExercises, setFriendCode, setProfileName, setProfileDraft,
}) {
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const syncTimerRef = useRef(null);

  // Load profile + app data from Supabase on login
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("username,friend_code,custom_exercises").eq("id", user.id).single();
        if (!error && data) {
          setFriendCode(data.friend_code || "");
          if (data.username) { setProfileName(data.username); setProfileDraft(data.username); }
          if (data.custom_exercises && typeof data.custom_exercises === "object") {
            setCustomExercises(prev => ({...data.custom_exercises, ...prev}));
          }
        }
        const cloud = await fetchAppData(user.id);
        if (cloud) {
          const cloudTs = cloud.lastModified || 0;
          const localTs = parseInt(localStorage.getItem("gt_last_modified")) || 0;
          if (cloudTs > localTs) {
            if (cloud.programs) setPrograms(cloud.programs);
            if (cloud.history) setHistory(cloud.history);
            if (cloud.primaryProgIdx != null) setPrimaryProgIdx(cloud.primaryProgIdx);
            if (cloud.appearance) setAppearance(cloud.appearance);
            if (cloud.customRestTimes) setCustomRestTimes(cloud.customRestTimes);
            if (cloud.favoriteExercises) setFavoriteExercises(new Set(cloud.favoriteExercises));
            if (cloud.hiddenExercises) setHiddenExercises(new Set(cloud.hiddenExercises));
            if (cloud.cardioHistory) setCardioHistory(cloud.cardioHistory);
            if (cloud.customCardio) setCustomCardio(cloud.customCardio);
            localStorage.setItem("gt_last_modified", String(cloudTs));
          }
        }
        setCloudLoaded(true);
      } catch (e) {
        console.warn("[AppSync] Load failed:", e.message);
        setCloudLoaded(true);
      }
    })();
  }, [user]);

  // Sync performance stats
  useEffect(() => {
    if (user && history.length) {
      syncPerformanceStats(user.id, history, {...EXERCISE_DB, ...customExercises});
    }
  }, [user, history.length]);

  // Sync custom exercises
  useEffect(() => {
    if (user && Object.keys(customExercises).length > 0) {
      syncCustomExercises(user.id, customExercises);
    }
  }, [user, customExercises]);

  // Debounced full app data sync
  useEffect(() => {
    if (!user || !cloudLoaded) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const appData = {
        programs, history, primaryProgIdx, appearance, customRestTimes,
        favoriteExercises: [...favoriteExercises],
        hiddenExercises: [...hiddenExercises],
        cardioHistory, customCardio, lastModified: now,
      };
      localStorage.setItem("gt_last_modified", String(now));
      syncAppData(user.id, appData);
    }, 2000);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [user, cloudLoaded, programs, history, primaryProgIdx, appearance, customRestTimes, favoriteExercises, hiddenExercises, cardioHistory, customCardio]);

  return { cloudLoaded };
}

// Persist state to localStorage
export function useLocalStorage(key, value, serialize = JSON.stringify) {
  useEffect(() => {
    localStorage.setItem(key, serialize(value));
  }, [key, value, serialize]);
}
