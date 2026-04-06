import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { fetchFriendStats } from "../utils/syncPerformance";
import { FRIEND_COLORS } from "../constants";
import { genFriendCode } from "../utils/helpers";

export function useFriends({ user, setCustomExercises, setFriendCode }) {
  const [friends, setFriends] = useState([]);
  const [selFriend, setSelFriend] = useState(0);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendCode, setAddFriendCode] = useState("");
  const [addFriendError, setAddFriendError] = useState("");
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);
  const [confirmRemoveFriend, setConfirmRemoveFriend] = useState(null);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    setFriendsLoading(true);
    try {
      const { data: ships, error: sErr } = await supabase.from("friendships").select("friend_id").eq("user_id", user.id);
      if (sErr || !ships || !ships.length) { setFriends([]); setFriendsLoading(false); return; }
      const friendIds = ships.map(s => s.friend_id);
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("id,username,custom_exercises").in("id", friendIds);
      if (pErr) { setFriendsLoading(false); return; }
      const allFriendCustomEx = {};
      const friendsList = await Promise.all((profiles || []).map(async (p, i) => {
        const hist = await fetchFriendStats(p.id);
        const friendCustomEx = p.custom_exercises && typeof p.custom_exercises === "object" ? p.custom_exercises : {};
        Object.assign(allFriendCustomEx, friendCustomEx);
        return { id: p.id, name: p.username || "Friend", history: hist, customExercises: friendCustomEx, color: FRIEND_COLORS[i % FRIEND_COLORS.length] };
      }));
      if (Object.keys(allFriendCustomEx).length > 0) {
        setCustomExercises(prev => {
          const merged = {...allFriendCustomEx, ...prev};
          return Object.keys(merged).length !== Object.keys(prev).length ? merged : prev;
        });
      }
      setFriends(friendsList);
    } catch (e) { /* offline */ }
    setFriendsLoading(false);
  }, [user, setCustomExercises]);

  const removeFriend = useCallback(async (friendId) => {
    if (!user) return;
    try {
      await supabase.from("friendships").delete().match({ user_id: user.id, friend_id: friendId });
      await supabase.from("friendships").delete().match({ user_id: friendId, friend_id: user.id });
      const newCode = genFriendCode();
      const { error } = await supabase.from("profiles").update({ friend_code: newCode }).eq("id", user.id);
      if (!error) setFriendCode(newCode);
      setSelFriend(0);
      await loadFriends();
    } catch (e) { console.warn("[Friends] Remove failed:", e.message); }
  }, [user, loadFriends, setFriendCode]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  return {
    friends, selFriend, setSelFriend, friendsLoading,
    showAddFriend, setShowAddFriend,
    addFriendCode, setAddFriendCode,
    addFriendError, setAddFriendError,
    addFriendSuccess, setAddFriendSuccess,
    confirmRemoveFriend, setConfirmRemoveFriend,
    loadFriends, removeFriend,
  };
}
