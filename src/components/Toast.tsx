import { useBible } from "../state/BibleContext";

export function Toast() {
  const { toast } = useBible();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
      <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-full shadow-lg text-sm font-mono">
        {toast}
      </div>
    </div>
  );
}
