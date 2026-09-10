import type { ReactNode } from "react";
import { useStore } from "@/store/useStore";

// Minimal brand glyphs kept local to this page.
const BRAND: Record<string, ReactNode> = {
  GitHub: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.36 1.11 2.94.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.11.39-2.02 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.74 0 3.92-2.34 4.78-4.57 5.03.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" /></svg>,
  Slack: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 15a2 2 0 1 1-2-2h2zm1 0a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0zM9 5a2 2 0 1 1 2 2H9zm0 1a2 2 0 1 1 0 4H4a2 2 0 1 1 0-4zm10 4a2 2 0 1 1 2 2h-2zm-1 0a2 2 0 1 1-4 0V5a2 2 0 1 1 4 0zm-4 10a2 2 0 1 1-2-2h2zm0-1a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4z" /></svg>,
  GitLab: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.5l3.7-11.3H8.3zM3 10.2L1.5 15c-.1.4 0 .9.4 1.1L12 21.5zm18 0L12 21.5l9.6-5.4c.4-.2.5-.7.4-1.1z" /></svg>,
  "Google Drive": <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3l-6 10.5h6.9L15 3zm2 12l3 5h9l-3-5zm11.5-1.5L15.5 3H10l6 10.5z" /></svg>,
  Discord: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 5.5A17 17 0 0 0 15 4l-.3.5a15 15 0 0 1 4 1.4A15 15 0 0 0 5.3 6a15 15 0 0 1 4-1.4L9 4a17 17 0 0 0-4.5 1.5C2 9 1.4 12.5 1.7 16a17 17 0 0 0 5 2.5l.6-1a11 11 0 0 1-1.7-.8l.4-.3a12 12 0 0 0 10 0l.4.3c-.5.3-1.1.6-1.7.8l.6 1a17 17 0 0 0 5-2.5c.4-4-.6-7.5-2.8-10.5zM9 14c-.8 0-1.5-.8-1.5-1.7S8.2 10.5 9 10.5s1.5.8 1.5 1.7S9.8 14 9 14zm6 0c-.8 0-1.5-.8-1.5-1.7s.7-1.8 1.5-1.8 1.5.8 1.5 1.7S15.8 14 15 14z" /></svg>,
  Jira: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 0L4 7.5a1 1 0 0 0 0 1.4L11.5 16l3-3-4.5-4.5L14.5 4zm1 4l4.5 4.5L12.5 13l-3 3 7.5 7.5a1 1 0 0 0 0-1.4z" /></svg>,
};

export default function Connectors() {
  const pushToast = useStore((s) => s.pushToast);
  const connectors = useStore((s) => s.connectors);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Connectors</div>
          <div className="page-sub">Link Orbit with the tools your team already uses.</div>
        </div>
      </div>
      <div className="conn-grid">
        {connectors.map((c) => (
          <div className="conn-card" key={c.name}>
            <div className="conn-top">
              <div className="conn-ic" style={{ color: c.color === "#e9eaee" ? "var(--text-primary)" : c.color }}>{BRAND[c.name]}</div>
              <div>
                <div className="conn-name">{c.name}</div>
                <div className={`conn-status ${c.status === "on" ? "on" : ""}`}>
                  <span className="sdot" />
                  {c.status === "on" ? "Connected" : "Not connected"}
                </div>
              </div>
            </div>
            <div className="conn-desc">{c.desc}</div>
            <button
              className={`btn ${c.status === "on" ? "btn-ghost" : "btn-primary"} btn-sm`}
              onClick={() => pushToast(`${c.name} — connection flow would open here`)}
            >
              {c.status === "on" ? "Manage" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
