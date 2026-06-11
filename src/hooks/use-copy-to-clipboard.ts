import * as React from "react";

type CopyFn = (text: string) => Promise<boolean>;

/**
 * Copies text to the clipboard and exposes a transient `isCopied` flag.
 * Returns a `[copy, isCopied]` tuple (devhop-compatible signature).
 */
export function useCopyToClipboard(delay = 2000): [CopyFn, boolean] {
  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = React.useCallback<CopyFn>(
    async (text) => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard not supported");
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsCopied(false), delay);
        return true;
      } catch (error) {
        console.warn("Copy failed", error);
        setIsCopied(false);
        return false;
      }
    },
    [delay],
  );

  return [copy, isCopied];
}
