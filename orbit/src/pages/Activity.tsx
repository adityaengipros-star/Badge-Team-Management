import { useEffect } from "react";
import { useStore, userById } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Activity() {
  const activity = useStore((s) => s.activity);
  const loadActivity = useStore((s) => s.loadActivity);

  useEffect(() => {
    void loadActivity(50);
  }, [loadActivity]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Activity</div>
          <div className="page-sub">Everything happening across your workspace.</div>
        </div>
      </div>
      {activity.length === 0 ? (
        <EmptyState title="No activity yet" body="Actions across your projects will show up here." />
      ) : (
        <div className="feed">
          {activity.map((a) => {
            const u = userById(a.userId);
            return (
              <div className="feed-item" key={a.id}>
                <Avatar user={u} />
                <div className="feed-body">
                  <div className="feed-text">
                    <b>{u.name}</b> {a.action} <b>{a.target}</b>
                    {a.extra ? ` ${a.extra}` : ""}
                    {a.from ? <> from <b>{a.from}</b> to <b>{a.to}</b></> : null}
                  </div>
                  <div className="feed-time">{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
