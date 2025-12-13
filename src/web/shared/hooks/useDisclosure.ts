import { useCallback, useState } from "react";

export function useDisclosure<T = unknown>(initial = false) {
  const [isOpen, setOpen] = useState(initial);
  const [data, setData] = useState<T | null>(null);
  const open = useCallback(() => setOpen(true), []);
  const openWith = useCallback((d: T) => {
    setData(d);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return { isOpen, open, openWith, close, toggle, data };
}
