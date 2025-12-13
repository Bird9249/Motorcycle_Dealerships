type Listener<Payload> = (payload: Payload) => void | Promise<void>;

export class EventEmitter<TEvents extends Record<string, unknown>> {
  private listeners: { [K in keyof TEvents]?: Set<Listener<TEvents[K]>> } = {};

  on<K extends keyof TEvents>(
    event: K,
    listener: Listener<TEvents[K]>,
  ): () => void {
    let set = this.listeners[event];
    if (!set) {
      set = new Set();
      this.listeners[event] = set;
    }
    set.add(listener as Listener<unknown> as Listener<TEvents[K]>);
    return () =>
      set?.delete(listener as Listener<unknown> as Listener<TEvents[K]>);
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): void {
    this.listeners[event]?.delete(
      listener as Listener<unknown> as Listener<TEvents[K]>,
    );
  }

  async emit<K extends keyof TEvents>(
    event: K,
    payload: TEvents[K],
  ): Promise<void> {
    const ls = this.listeners[event];
    if (!ls || ls.size === 0) return;
    for (const l of Array.from(ls)) {
      await l(payload);
    }
  }

  clear(): void {
    for (const key in this.listeners) {
      this.listeners[key as keyof TEvents]?.clear();
    }
  }
}

export function createEventBus<TEvents extends Record<string, unknown>>() {
  return new EventEmitter<TEvents>();
}
