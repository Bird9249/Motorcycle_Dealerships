import * as React from "react";

type DebounceOptions = {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
};

type ControlFunctions = {
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
};

// biome-ignore lint/suspicious/noExplicitAny: generic callback signature
export type DebouncedState<T extends (...args: any) => ReturnType<T>> = ((
  ...args: Parameters<T>
) => ReturnType<T> | undefined) &
  ControlFunctions;

/**
 * Debounce a callback. API-compatible with usehooks-ts `useDebounceCallback`.
 * Supports `leading`/`trailing`/`maxWait` options.
 */
// biome-ignore lint/suspicious/noExplicitAny: generic callback signature
export function useDebounceCallback<T extends (...args: any) => ReturnType<T>>(
  func: T,
  delay = 500,
  options?: DebounceOptions,
): DebouncedState<T> {
  const funcRef = React.useRef(func);
  funcRef.current = func;

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastArgsRef = React.useRef<Parameters<T> | null>(null);
  const lastResultRef = React.useRef<ReturnType<T> | undefined>(undefined);
  const leadingInvokedRef = React.useRef(false);

  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;
  const maxWait = options?.maxWait;

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const invoke = React.useCallback(() => {
    if (!lastArgsRef.current) return;
    lastResultRef.current = funcRef.current(
      ...lastArgsRef.current,
    ) as ReturnType<T>;
    lastArgsRef.current = null;
  }, []);

  const debounced = React.useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;

      if (leading && !leadingInvokedRef.current && !timeoutRef.current) {
        leadingInvokedRef.current = true;
        invoke();
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (trailing && lastArgsRef.current) invoke();
        leadingInvokedRef.current = false;
        clearTimers();
      }, delay);

      if (maxWait != null && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          if (lastArgsRef.current) invoke();
          leadingInvokedRef.current = false;
          clearTimers();
        }, maxWait);
      }

      return lastResultRef.current;
    },
    [delay, leading, trailing, maxWait, invoke, clearTimers],
  ) as DebouncedState<T>;

  debounced.cancel = React.useCallback(() => {
    clearTimers();
    lastArgsRef.current = null;
    leadingInvokedRef.current = false;
  }, [clearTimers]);

  debounced.flush = React.useCallback(() => {
    if (lastArgsRef.current) invoke();
    clearTimers();
    leadingInvokedRef.current = false;
  }, [clearTimers, invoke]);

  debounced.isPending = React.useCallback(() => timeoutRef.current != null, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  return debounced;
}
