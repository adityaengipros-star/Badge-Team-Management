import { useState } from "react";
import { Search, Send } from "lucide-react";
import { CHANNELS, DMS, MESSAGES } from "@/data/mock";
import { userById } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";

export default function Chats() {
  const [active, setActive] = useState("c1");
  const channel = CHANNELS.find((c) => c.id === active);
  const dm = DMS.find((d) => d.id === active);
  const title = channel ? channel.name : dm ? userById(dm.userId).name : "";

  return (
    <div className="page" style={{ paddingBottom: 20 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Chats</div>
          <div className="page-sub">Team communication, organized by project.</div>
        </div>
      </div>

      <div className="chat-wrap">
        <div className="chat-list">
          <div className="field chat-search">
            <Search size={14} strokeWidth={2} />
            <input placeholder="Search" style={{ width: "100%" }} />
          </div>
          <div className="chan-group">Channels</div>
          {CHANNELS.map((c) => (
            <button key={c.id} className={`chan ${c.id === active ? "active" : ""}`} onClick={() => setActive(c.id)}>
              <span className="hash">#</span>
              {c.name}
              {c.unread ? <span className="unread">{c.unread}</span> : null}
            </button>
          ))}
          <div className="chan-group">Direct Messages</div>
          {DMS.map((d) => {
            const u = userById(d.userId);
            return (
              <button key={d.id} className={`chan ${d.id === active ? "active" : ""}`} onClick={() => setActive(d.id)}>
                <Avatar user={u} size="sm" />
                {u.name}
              </button>
            );
          })}
        </div>

        <div className="chat-main">
          <div className="chat-head">
            {channel && <span className="hash" style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 600 }}>#</span>}
            <b>{title}</b>
            {channel?.desc && <span className="desc">{channel.desc}</span>}
          </div>
          <div className="chat-body">
            <div className="day-sep">Today</div>
            {MESSAGES.map((m) => {
              const u = userById(m.userId);
              return (
                <div className="msg" key={m.id}>
                  <Avatar user={u} />
                  <div className="msg-body">
                    <div className="msg-top"><b>{u.name}</b><time>{m.time}</time></div>
                    <div className="msg-text">{m.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chat-input">
            <div className="box">
              <input placeholder={`Message ${channel ? "#" + channel.name : title}`} />
              <button className="icon-btn"><Send size={17} strokeWidth={2} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
