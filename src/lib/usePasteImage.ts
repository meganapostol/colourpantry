import { useEffect } from "react";

/**
 * Listens for window-level paste events and invokes `onImage` whenever the
 * clipboard contains an image. If the user pastes into a real text input or
 * contenteditable AND the clipboard has text, the default behaviour is left
 * alone so hex codes etc. still paste correctly.
 */
export function usePasteImage(onImage: (file: File) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: ClipboardEvent) => {
      const cd = e.clipboardData;
      if (!cd) return;

      const target = e.target as HTMLElement | null;
      const isTextInput =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTextInput) {
        const txt = cd.getData("text");
        if (txt && txt.trim().length > 0) return;
      }

      for (let i = 0; i < cd.items.length; i++) {
        const it = cd.items[i];
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            onImage(f);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [onImage, enabled]);
}
