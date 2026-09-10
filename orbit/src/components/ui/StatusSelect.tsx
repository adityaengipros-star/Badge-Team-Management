import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { StatusId } from "@/types";
import { STATUSES, STATUS_COLORS, statusById } from "@/data/constants";

/**
 * A status badge that opens a small dropdown to change status.
 * The menu renders in a portal at fixed coordinates so it never gets
 * clipped by card/board overflow.
 */
export function StatusSelect({
  status,
  onChange,
  onClickCapture,
}: {
  status: StatusId;
  onChange: (s: StatusId) => void;
  onClickCapture?: (e: React.MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const s = statusById(status);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    onClickCapture?.(e);
    const r = btnRef.current!.getBoundingClientRect();
    const menuW = 190;
    const menuH = STATUSES.length * 36 + 14;
    let x = r.left;
    let y = r.bottom + 6;
    if (x + menuW > window.innerWidth - 10) x = window.innerWidth - menuW - 10;
    if (y + menuH > window.innerHeight - 10) y = r.top - menuH - 6;
    setPos({ x, y });
    setOpen((o) => !o);
  }

  return (
    <>
      <button ref={btnRef} className={`status ${s.cls}`} onClick={toggle}>
        <span className="sdot" />
        {s.label}
      </button>
      {open &&
        createPortal(
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 84 }} onClick={() => setOpen(false)} />
            <div className="menu open" style={{ left: pos.x, top: pos.y, zIndex: 85 }}>
              {STATUSES.map((opt) => (
                <button
                  key={opt.id}
                  className={`menu-item ${opt.id === status ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    if (opt.id !== status) onChange(opt.id);
                  }}
                >
                  <span className="sdot" style={{ background: STATUS_COLORS[opt.id] }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
