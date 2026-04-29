import { useStash } from "../state/StashContext";

export function Toast() {
  const { toast } = useStash();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-ink-light text-canvas-light dark:bg-ink-dark dark:text-canvas-dark px-4 py-2.5 rounded-full shadow-lift text-[13px] font-mono tracking-tight">
        {toast}
      </div>
    </div>
  );
}
