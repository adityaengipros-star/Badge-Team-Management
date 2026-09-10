import { Plus, Inbox } from "lucide-react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="empty">
      <div className="empty-ic">
        <Inbox size={26} strokeWidth={1.8} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action && (
        <button className="btn btn-primary" style={{ display: "inline-flex" }} onClick={action.onClick}>
          <Plus size={15} strokeWidth={2.2} /> {action.label}
        </button>
      )}
    </div>
  );
}
