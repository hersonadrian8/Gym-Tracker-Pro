import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const THEMES = {
  dark: {
    bg:"#0a0a0a",surface:"#1c1c1e",surfaceAlt:"#2c2c2e",border:"#38383a",
    text:"#f5f5f7",textSec:"#98989d",textMuted:"#636366",textFaint:"#48484a",
    accent:"#818cf8",accentDark:"#6366f1",
    red:"#ff453a",redBg:"#ff453a20",
    inputBg:"#0a0a0a",
  },
  light: {
    bg:"#f2f2f7",surface:"#ffffff",surfaceAlt:"#e5e5ea",border:"#c6c6c8",
    text:"#1c1c1e",textSec:"#636366",textMuted:"#8e8e93",textFaint:"#aeaeb2",
    accent:"#5856d6",accentDark:"#4a48c4",
    red:"#ff3b30",redBg:"#ff3b3015",
    inputBg:"#f2f2f7",
  },
};

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const t = systemDark ? THEMES.dark : THEMES.light;

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (user) {
      const friendCode = "GT-" + Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(36).toUpperCase()).join("").slice(0, 6).padEnd(6, "X");

      const { error: profileErr } = await supabase.from("profiles").insert({
        id: user.id,
        username: displayName.trim(),
        friend_code: friendCode,
      });
      if (profileErr) {
        setError("Account created but profile setup failed. Try logging in.");
      }
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "signup") handleSignUp();
    else handleLogin();
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <style>{`body{background:${t.bg}}`}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${t.accent},${t.accentDark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22, fontWeight: 800, color: "#fff" }}>G</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: t.text, margin: "0 0 4px" }}>Gym Tracker</h1>
          <p style={{ fontSize: 12, color: t.textMuted, margin: 0 }}>Track your lifts, compare with friends</p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: 3, marginBottom: 20, background: t.surface, borderRadius: 10, padding: 3 }}>
          <button onClick={() => { setMode("login"); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === "login" ? t.surfaceAlt : "transparent", color: mode === "login" ? t.text : t.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Log In</button>
          <button onClick={() => { setMode("signup"); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === "signup" ? t.surfaceAlt : "transparent", color: mode === "signup" ? t.text : t.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Sign Up</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: t.surface, borderRadius: 10, border: `1px solid ${t.border}`, padding: 16 }}>
            {mode === "signup" && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Display Name</div>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 16, outline: "none", boxSizing: "border-box" }} />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Email</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 16, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: error ? 12 : 0 }}>
              <div style={{ fontSize: 9, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Password</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 16, outline: "none", boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ padding: "8px 10px", background: t.redBg, borderRadius: 8, border: `1px solid ${t.red}30`, fontSize: 11, color: t.red, fontWeight: 500 }}>{error}</div>}
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${t.accent},${t.accentDark})`, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer", marginTop: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: t.textFaint }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontWeight: 600, fontSize: 11, padding: 0 }}>
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
