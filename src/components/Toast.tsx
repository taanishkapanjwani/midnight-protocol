import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMessage(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3600);
  }, []);
  return { message, show };
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="gilded-soft max-w-md rounded-2xl border bg-ivory px-6 py-4 text-center font-serif text-lg italic text-burgundy"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
