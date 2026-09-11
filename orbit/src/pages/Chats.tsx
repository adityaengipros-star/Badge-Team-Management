import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Send, Hash } from "lucide-react";
import type { Channel, Message } from "@/types";
import { api } from "@/lib/api";
import { userById } from "@/store/useStore";
import { Avatar } from "@/components/ui/Avatar";

const POLL_MS = 4000;

export default function Chats() {
  const [searchParams] = useSearchParams();
  const dmParam = searchParams.get("dm");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number>();
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const active = [...channels, ...dms].find((c) => c.id === activeId) || null;

  // Load the channel + DM list. Extracted so we can refetch when a new DM opens.
  function loadChannels(selectId?: string) {
    return api.listChannels()
      .then((res) => {
        setChannels(res.channels);
        setDms(res.dms);
        setActiveId((cur) => selectId ?? cur ?? res.channels[0]?.id ?? res.dms[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadChannels(dmParam ?? undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Arriving from search ("message this person") sets ?dm=<id>: open it and
  // refresh the sidebar so a brand-new DM shows up.
  useEffect(() => {
    if (!dmParam) return;
    setActiveId(dmParam);
    void loadChannels(dmParam);
  }, [dmParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages + poll for new ones whenever the active conversation changes.
  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    setMessages([]);

    api.listMessages(activeId).then((m) => { if (alive) setMessages(m); }).catch(() => {});

    pollRef.current = window.setInterval(async () => {
      const after = messagesRef.current[messagesRef.current.length - 1]?.ts;
      try {
        const fresh = await api.listMessages(activeId, after);
        if (alive && fresh.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((x) => x.id));
            return [...prev, ...fresh.filter((x) => !seen.has(x.id))];
          });
        }
      } catch { /* ignore transient poll errors */ }
    }, POLL_MS);

    return () => { alive = false; window.clearInterval(pollRef.current); };
  }, [activeId]);

  // Keep a ref of messages so the poll closure reads the latest cursor.
  // Auto-scroll to newest.
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    try {
      const msg = await api.postMessage(activeId, text);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch { /* ignore */ }
  }

  const title = active ? (active.kind === "dm" ? active.name : active.name) : "";

  return (
    <div className="page" style={{ paddingTop: 16, paddingBottom: 16 }}>
      <div className="chat-wrap">
        <div className="chat-list">
          <div className="field chat-search">
            <Search size={14} strokeWidth={2} />
            <input placeholder="Search" style={{ width: "100%" }} />
          </div>

          <div className="chan-group">Channels</div>
          {channels.map((c) => (
            <button key={c.id} className={`chan ${c.id === activeId ? "active" : ""}`} onClick={() => setActiveId(c.id)}>
              <span className="hash">#</span>{c.name}
            </button>
          ))}

          <div className="chan-group">Direct Messages</div>
          {dms.length === 0 && <div style={{ padding: "4px 10px", fontSize: 12, color: "var(--text-muted)" }}>No direct messages yet.</div>}
          {dms.map((d) => (
            <button key={d.id} className={`chan ${d.id === activeId ? "active" : ""}`} onClick={() => setActiveId(d.id)}>
              {d.name}
            </button>
          ))}
        </div>

        <div className="chat-main">
          <div className="chat-head">
            {active?.kind !== "dm" && <span className="hash" style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 600 }}>#</span>}
            <b>{title}</b>
            {active?.desc && <span className="desc">{active.desc}</span>}
          </div>

          <div className="chat-body">
            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13, margin: "auto" }}>
                <Hash size={20} style={{ marginBottom: 6 }} /><div>No messages yet — say hello.</div>
              </div>
            ) : (
              <>
                <div className="day-sep">Conversation</div>
                {messages.map((m) => {
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
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="chat-input">
            <div className="box">
              <input
                placeholder={active ? (active.kind === "dm" ? `Message ${active.name}` : `Message #${active.name}`) : "Select a conversation"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                disabled={!activeId}
              />
              <button className="icon-btn" onClick={() => void send()} disabled={!draft.trim()}>
                <Send size={17} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
