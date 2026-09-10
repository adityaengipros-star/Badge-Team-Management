import { Check } from "lucide-react";
import { useStore } from "@/store/useStore";

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <span className="t-ic">
            <Check size={14} strokeWidth={2.6} />
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
