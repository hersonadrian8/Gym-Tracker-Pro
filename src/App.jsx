import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import GymTracker from "./GymTracker";
import Auth from "./components/Auth";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
    return (
      <div style={{ minHeight: "100vh", background: dark ? "#0a0a0a" : "#f2f2f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: dark ? "#636366" : "#8e8e93", fontSize: 14, fontFamily: "system-ui" }}>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <GymTracker user={session.user} signOut={signOut} />;
}

export default App;
