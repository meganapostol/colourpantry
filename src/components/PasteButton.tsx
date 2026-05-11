import { useState } from "react";

interface Props {
  onImage: (file: File) => void;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

/**
 * Explicit "Paste from clipboard" button. Uses the async Clipboard API when the
 * browser supports it; falls back to nudging the user to press Ctrl/Cmd+V (the
 * window-level paste listener will then catch the event).
 */
export function PasteButton({
  onImage,
  className = "",
  children,
  title = "Paste an image from your clipboard",
}: Props) {
  const [hint, setHint] = useState<string | null>(null);

  const flash = (msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint(null), 1600);
  };

  const onClick = async () => {
    const clip = navigator.clipboard as Clipboard & {
      read?: () => Promise<ClipboardItem[]>;
    };
    if (!clip || typeof clip.read !== "function") {
      flash("Press Ctrl/Cmd+V");
      return;
    }
    try {
      const items = await clip.read();
      for (const item of items) {
        const t = item.types.find((s) => s.startsWith("image/"));
        if (t) {
          const blob = await item.getType(t);
          const ext = t.split("/")[1] || "png";
          const file = new File([blob], `pasted.${ext}`, { type: t });
          onImage(file);
          return;
        }
      }
      flash("No image in clipboard");
    } catch {
      flash("Press Ctrl/Cmd+V");
    }
  };

  return (
    <button onClick={onClick} className={className} title={title} type="button">
      {hint ?? children ?? "Paste"}
    </button>
  );
}
