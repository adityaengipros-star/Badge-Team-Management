import type { User } from "@/types";

export function Avatar({
  user,
  size = "",
  showPresence = false,
}: {
  user: User;
  size?: "" | "sm" | "lg";
  showPresence?: boolean;
}) {
  return (
    <div
      className={`avatar ${size}`}
      style={{ background: user.color }}
      title={user.name}
    >
      {user.init}
      {showPresence && <span className={`presence ${user.presence === "online" ? "" : user.presence}`} />}
    </div>
  );
}
