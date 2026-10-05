"use client";

import { motion, useAnimationControls } from "motion/react";
import { useState } from "react";
import { GlassPane } from "./Glass";
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
    <motion.main
      className="ja-signin"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <div className="ja-signin__mark" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- the app icon, already sized */}
        <img src="/app/icon-192.png" alt="" width={84} height={84} />
      </div>
      <h1 className="ja-signin__title">Jomiez</h1>
      <p className="ja-signin__lede">Run the site from your phone. Sign in with your admin account.</p>
      <motion.div animate={shake} className="ja-signin__card-wrap">
        <GlassPane tone="thick" className="ja-signin__card">
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
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
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
            <motion.button type="submit" className="ja-btn ja-btn--primary ja-btn--block" whileTap={{ scale: 0.97 }} disabled={busy}>
              {busy ? <span className="ja-spin" /> : "Sign in"}
            </motion.button>
          </form>
        </GlassPane>
      </motion.div>
    </motion.main>
  );
}
