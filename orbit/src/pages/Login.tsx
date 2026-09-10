import { useState } from "react";
import { useStore } from "@/store/useStore";

export default function Login() {
  const login = useStore((s) => s.login);
  const loggingIn = useStore((s) => s.loggingIn);
  const authError = useStore((s) => s.authError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await login(email.trim(), password);
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <div className="brand-logo" style={{ width: 36, height: 36 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
            </svg>
          </div>
          <div>
            <div className="auth-title">Sign in to Orbit</div>
            <div className="auth-sub">Your engineering workspace</div>
          </div>
        </div>

        <label className="form-label" htmlFor="email">Email</label>
        <input
          id="email"
          className="form-input"
          type="email"
          autoComplete="username"
          placeholder="you@orbit.dev"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />

        <label className="form-label" htmlFor="password" style={{ marginTop: 14 }}>Password</label>
        <input
          id="password"
          className="form-input"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {authError && <div className="auth-error">{authError}</div>}

        <button className="btn btn-primary auth-submit" type="submit" disabled={loggingIn}>
          {loggingIn ? "Signing in…" : "Sign in"}
        </button>

        <div className="auth-hint">
          Seeded demo login — <b>aditya@orbit.dev</b> / <b>changeme123</b>
        </div>
      </form>
    </div>
  );
}
