import { supabase } from "../supabaseClient";

export async function syncPerformanceStats(userId, history, exerciseDb = {}) {
  if (!userId || !history || !history.length) return;

  try {
    const lastSyncKey = `gt_last_sync_${userId}`;
    const migrationKey = `gt_sync_v2_${userId}`;
    if (!localStorage.getItem(migrationKey)) {
      localStorage.removeItem(lastSyncKey);
      localStorage.setItem(migrationKey, "1");
    }
    const lastSync = localStorage.getItem(lastSyncKey) || "1970-01-01";

    const newEntries = history.filter(h => h.isoDate && h.isoDate >= lastSync);
    if (!newEntries.length) { console.log("[Sync] No new entries since", lastSync); return; }

    const rows = newEntries.map(h => ({
      user_id: userId,
      exercise_name: h.exercise,
      weight: h.weight,
      reps: h.reps,
      sets: h.sets,
      workout_date: h.isoDate,
      muscle: exerciseDb[h.exercise]?.muscle || null,
      program: h.program || null,
      split: h.split || null,
    }));

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      console.log("[Sync] Upserting batch", i, "→", batch.length, "rows", batch[0]);
      const { error } = await supabase
        .from("performance_stats")
        .upsert(batch, { onConflict: "user_id,exercise_name,workout_date" });
      console.log("[Sync] Result:", error ? error.message : "OK");
      if (error) {
        // Fallback: try without new columns if they don't exist yet
        if (error.message && (error.message.includes("column") || error.code === "42703")) {
          const fallbackBatch = batch.map(({ muscle, program, split, ...rest }) => rest);
          const { error: err2 } = await supabase
            .from("performance_stats")
            .upsert(fallbackBatch, { onConflict: "user_id,exercise_name,workout_date" });
          if (err2) { console.warn("Sync fallback failed:", err2.message); return; }
        } else {
          console.warn("Sync batch failed:", error.message);
          return;
        }
      }
    }

    const maxDate = newEntries.reduce((m, h) => (h.isoDate > m ? h.isoDate : m), "1970-01-01");
    localStorage.setItem(lastSyncKey, maxDate);
  } catch (err) {
    console.warn("Performance sync failed:", err.message);
  }
}

export async function fetchFriendStats(friendId) {
  try {
    const { data, error } = await supabase
      .from("performance_stats")
      .select("exercise_name, weight, reps, sets, workout_date, muscle, program, split")
      .eq("user_id", friendId)
      .order("workout_date", { ascending: true });

    if (error) {
      // Fallback: try without new columns
      if (error.message && (error.message.includes("column") || error.code === "42703")) {
        const { data: d2, error: e2 } = await supabase
          .from("performance_stats")
          .select("exercise_name, weight, reps, sets, workout_date")
          .eq("user_id", friendId)
          .order("workout_date", { ascending: true });
        if (e2 || !d2) return [];
        return d2.map(row => ({
          exercise: row.exercise_name,
          date: new Date(row.workout_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          isoDate: row.workout_date,
          weight: row.weight, reps: row.reps, sets: row.sets,
        }));
      }
      console.warn("Failed to fetch friend stats:", error.message);
      return [];
    }

    return (data || []).map(row => ({
      exercise: row.exercise_name,
      date: new Date(row.workout_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isoDate: row.workout_date,
      weight: row.weight,
      reps: row.reps,
      sets: row.sets,
      muscle: row.muscle || null,
      program: row.program || null,
      split: row.split || null,
    }));
  } catch (err) {
    console.warn("Failed to fetch friend stats:", err.message);
    return [];
  }
}

export async function syncCustomExercises(userId, customExercises) {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ custom_exercises: customExercises })
      .eq("id", userId);
    if (error && !error.message?.includes("column")) {
      console.warn("Custom exercises sync failed:", error.message);
    }
  } catch (err) {
    console.warn("Custom exercises sync failed:", err.message);
  }
}

// Sync all app data (programs, history, favorites, etc.) to Supabase
export async function syncAppData(userId, appData) {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ app_data: appData })
      .eq("id", userId);
    if (error) {
      if (error.message?.includes("column") || error.code === "42703") {
        console.warn("[AppSync] app_data column doesn't exist yet. Run: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_data jsonb DEFAULT '{}';");
      } else {
        console.warn("[AppSync] Failed:", error.message);
      }
    } else {
      console.log("[AppSync] Synced to cloud");
    }
  } catch (err) {
    console.warn("[AppSync] Failed:", err.message);
  }
}

// Fetch app data from Supabase on login
export async function fetchAppData(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("app_data")
      .eq("id", userId)
      .single();
    if (error) {
      if (error.message?.includes("column") || error.code === "42703") return null;
      console.warn("[AppSync] Fetch failed:", error.message);
      return null;
    }
    return data?.app_data || null;
  } catch (err) {
    console.warn("[AppSync] Fetch failed:", err.message);
    return null;
  }
}
