type Listener<T> = (payload: T) => void;

export class EventBus<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<Events[keyof Events]>>>();

  on<Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>): () => void {
    const listeners = this.listeners.get(event) ?? new Set<Listener<Events[keyof Events]>>();
    listeners.add(listener as Listener<Events[keyof Events]>);
    this.listeners.set(event, listeners);
    return () => this.off(event, listener);
  }

  once<Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>): () => void {
    const remove = this.on(event, (payload) => {
      remove();
      listener(payload);
    });
    return remove;
  }

  off<Key extends keyof Events>(event: Key, listener: Listener<Events[Key]>): void {
    const listeners = this.listeners.get(event);
    listeners?.delete(listener as Listener<Events[keyof Events]>);
    if (listeners?.size === 0) this.listeners.delete(event);
  }

  emit<Key extends keyof Events>(event: Key, payload: Events[Key]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of [...listeners]) listener(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}
