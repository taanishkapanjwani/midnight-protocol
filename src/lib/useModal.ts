import { useEffect, useRef } from "react";

// Accessible modal behavior: Escape closes, the page behind stops scrolling, focus moves inside.
// The effect runs once; the latest onClose is kept in a ref so re-renders don't steal focus.
export function useModal(onClose: () => void) {
  const focusRef = useRef<HTMLButtonElement>(null);
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    const prev = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    focusRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cb.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);
  return focusRef;
}
