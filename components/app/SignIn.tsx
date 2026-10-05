"use client";

import { motion, useAnimationControls } from "motion/react";
import { useState } from "react";
import { Droplet } from "./Droplet";
import { LiquidGlass } from "./LiquidGlass";
import { deviceName, post, tap, type AppUser } from "./lib";

/* Signing in on the phone: the team's own admin account, remembered on this phone when asked. */
export function SignIn({ onSignedIn }: { onSignedIn: (user: AppUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shake = useAnimationControls();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await post<{ user: AppUser }>("/api/app/login", { email, password, remember, device: deviceName() });
      tap(12);
      onSignedIn(out.user);
    } catch (err) {
      setError((err as Error).message);
      tap(30);
      void shake.start({ x: [0, -14, 12, -8, 6, -3, 0], transition: { duration: 0.5 } });
    }
    setBusy(false);
  };

  return (
    <motion.main className="ja-signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.35 }}>
      <motion.div
        className="ja-signin__head"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.05 }}
      >
        <Droplet size={92} />
        <h1>Jomiez</h1>
        <p>Run the site from your phone. Sign in with your admin account.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.12 }}>
        <motion.div animate={shake}>
          <LiquidGlass material="thick" radius={32} className="ja-signin__card">
            <form onSubmit={submit}>
              <label className="ja-field">
                <span>Email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@jomiez.com"
                />
              </label>
              <label className="ja-field">
                <span>Password</span>
                <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              </label>
              <label className="ja-toggle-row">
                <span>
                  <strong>Stay signed in on this phone</strong>
                  <small>For 90 days, until you sign out.</small>
                </span>
                <input type="checkbox" role="switch" className="ja-switch" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              </label>
              {error && (
                <p className="ja-signin__error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="ja-btn ja-btn--primary ja-btn--block" disabled={busy}>
                {busy ? <span className="ja-spin" /> : "Sign in"}
              </button>
            </form>
          </LiquidGlass>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
