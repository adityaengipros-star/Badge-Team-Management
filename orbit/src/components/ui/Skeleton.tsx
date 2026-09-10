export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="task-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="task-card skeleton-card" key={i}>
          <div className="sk sk-row" style={{ width: "40%" }} />
          <div className="sk sk-row" style={{ width: "85%", height: 15 }} />
          <div className="sk sk-row" style={{ width: "60%" }} />
          <div style={{ display: "flex", gap: 6 }}>
            <div className="sk sk-chip" />
            <div className="sk sk-chip" />
          </div>
          <div className="sk sk-row" style={{ width: "45%" }} />
          <div className="tc-foot" style={{ borderTopColor: "var(--border)" }}>
            <div className="sk sk-avatar" />
            <div className="sk sk-row" style={{ width: 60, marginBottom: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
