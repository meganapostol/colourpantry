import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Colour-critical routes: people judge swatches here, so the hue bloom must
// never tint the canvas behind them. The lamp is luminance-only and stays.
const QUIET_ROUTES = [
  "/family/",
  "/lookup",
  "/contrast",
  "/skin",
  "/glaze",
  "/variations",
];

const LAMP_SIZE = "92vmax";
const BLOOM_SIZE = "115vmax";

export function Backdrop() {
  const { pathname } = useLocation();
  const lampRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const quietRef = useRef(false);
  quietRef.current = QUIET_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    const lamp = lampRef.current;
    const bloom = bloomRef.current;
    if (!lamp || !bloom) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.42;
    let x = tx;
    let y = ty;
    let bloomTarget = 0;
    let bloomAlpha = 0;
    let idleT = 0;
    let lastMove = 0;

    const place = (el: HTMLDivElement, px: number, py: number) => {
      el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      lastMove = performance.now();
    };

    const onBloom = (e: Event) => {
      const hex = (e as CustomEvent<string | null>).detail;
      if (hex && !quietRef.current) {
        bloom.style.background = `radial-gradient(closest-side, ${hex}, transparent 70%)`;
        bloomTarget = 1;
      } else {
        bloomTarget = 0;
      }
    };

    if (reduced) {
      // Static ambience: centred lamp, no follow, bloom still fades via CSS.
      place(lamp, tx, ty);
      place(bloom, tx, ty);
      bloom.style.transition = "opacity 0.6s ease";
      const onBloomStatic = (e: Event) => {
        const hex = (e as CustomEvent<string | null>).detail;
        if (hex && !quietRef.current) {
          bloom.style.background = `radial-gradient(closest-side, ${hex}, transparent 70%)`;
          bloom.style.opacity = "0.09";
        } else {
          bloom.style.opacity = "0";
        }
      };
      window.addEventListener("cp:bloom", onBloomStatic);
      return () => window.removeEventListener("cp:bloom", onBloomStatic);
    }

    const tick = (t: number) => {
      // After 4s of stillness (or on touch), the lamp drifts on its own.
      if (t - lastMove > 4000) {
        idleT += 16;
        tx = window.innerWidth * (0.5 + 0.24 * Math.sin(idleT * 0.00021));
        ty = window.innerHeight * (0.44 + 0.18 * Math.sin(idleT * 0.00013 + 1.7));
      }
      x += (tx - x) * 0.055;
      y += (ty - y) * 0.055;
      place(lamp, x, y);
      place(bloom, x, y);
      bloomAlpha += ((quietRef.current ? 0 : bloomTarget) - bloomAlpha) * 0.07;
      bloom.style.opacity = String(bloomAlpha * 0.09);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("cp:bloom", onBloom);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("cp:bloom", onBloom);
    };
  }, []);

  // Leaving a page kills any lingering bloom.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent<string | null>("cp:bloom", { detail: null }));
  }, [pathname]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div
        ref={lampRef}
        className="backdrop-lamp absolute top-0 left-0"
        style={{ width: LAMP_SIZE, height: LAMP_SIZE }}
      />
      <div
        ref={bloomRef}
        className="absolute top-0 left-0"
        style={{ width: BLOOM_SIZE, height: BLOOM_SIZE, opacity: 0 }}
      />
    </div>
  );
}
