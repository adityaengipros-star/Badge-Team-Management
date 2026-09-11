import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";

type Mode = "signin" | "register";

export default function Login() {
  const login = useStore((s) => s.login);
  const loggingIn = useStore((s) => s.loggingIn);
  const authError = useStore((s) => s.authError);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signin") {
      await login(email.trim(), password);
      return;
    }
    setBusy(true);
    setRegError(null);
    try {
      await api.register(name.trim(), email.trim(), password);
      setDone(true);
    } catch (err) {
      setRegError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setRegError(null);
    setDone(false);
    setPassword("");
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
            <div className="auth-title">{mode === "signin" ? "Sign in to Orbit" : "Request access"}</div>
            <div className="auth-sub">{mode === "signin" ? "Your engineering workspace" : "An admin will review your request"}</div>
          </div>
        </div>

        {done ? (
          <div className="auth-done">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Request submitted ✓</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Thanks, {name.split(" ")[0] || "there"}. An admin will review your request. You'll be able to sign in once it's approved.
            </div>
            <button type="button" className="btn btn-ghost auth-submit" onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            {mode === "register" && (
              <>
                <label className="form-label" htmlFor="name">Full name</label>
                <input id="name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoFocus required />
                <div style={{ height: 14 }} />
              </>
            )}

            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={mode === "signin"}
              required
            />

            <label className="form-label" htmlFor="password" style={{ marginTop: 14 }}>Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "register" ? "At least 8 characters" : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {(mode === "signin" ? authError : regError) && (
              <div className="auth-error">{mode === "signin" ? authError : regError}</div>
            )}

<<<<<<< HEAD
            <button className="btn btn-primary auth-submit" type="submit" disabled={mode === "signin" ? loggingIn : busy}>
              {mode === "signin" ? (loggingIn ? "Signing in\u2026" : "Sign in") : busy ? "Submitting\u2026" : "Request access"}
            </button>

            <div className="auth-switch">
              {mode === "signin" ? (
                <>New here? <button type="button" onClick={() => switchMode("register")}>Request access</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode("signin")}>Sign in</button></>
              )}
            </div>
          </>
        )}
=======
>>>>>>> 70b78db (Server changes)
      </form>
    </div>
  );
}
