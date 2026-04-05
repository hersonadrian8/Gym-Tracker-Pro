import { supabase } from "../supabaseClient";

export async function syncPerformanceStats(userId, history) {
  if (!userId || !history || !history.length) return;

  try {
    // Get already synced entries to avoid duplicates
    const lastSyncKey = `gt_last_sync_${userId}`;
    const lastSync = localStorage.getItem(lastSyncKey) || "1970-01-01";

    // Filter entries that are new since last sync
    const newEntries = history.filter(h => h.isoDate && h.isoDate >= lastSync);
    if (!newEntries.length) return;

    // Build rows for upsert
    const rows = newEntries.map(h => ({
      user_id: userId,
      exercise_name: h.exercise,
      weight: h.weight,
      reps: h.reps,
      sets: h.sets,
      workout_date: h.isoDate,
    }));

    // Upsert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from("performance_stats")
        .upsert(batch, { onConflict: "user_id,exercise_name,workout_date" });
      if (error) {
        console.warn("Sync batch failed:", error.message);
        return; // Don't update lastSync if we failed
      }
    }

    // Update last sync timestamp
    const maxDate = newEntries.reduce((m, h) => (h.isoDate > m ? h.isoDate : m), "1970-01-01");
    localStorage.setItem(lastSyncKey, maxDate);
  } catch (err) {
    // Silent fail — offline or error, don't break the app
    console.warn("Performance sync failed:", err.message);
  }
}

export async function fetchFriendStats(friendId) {
  try {
    const { data, error } = await supabase
      .from("performance_stats")
      .select("exercise_name, weight, reps, sets, workout_date")
      .eq("user_id", friendId)
      .order("workout_date", { ascending: true });

    if (error) {
      console.warn("Failed to fetch friend stats:", error.message);
      return [];
    }

    // Map to the history format used by the app
    return (data || []).map(row => ({
      exercise: row.exercise_name,
      date: new Date(row.workout_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isoDate: row.workout_date,
      weight: row.weight,
      reps: row.reps,
      sets: row.sets,
    }));
  } catch (err) {
    console.warn("Failed to fetch friend stats:", err.message);
    return [];
  }
}
