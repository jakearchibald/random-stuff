interface GlobalEventMap {
  expandall: Event;
  collapseall: Event;
}

export const globalEvents = new EventTarget() as EventTarget & {
  addEventListener<K extends keyof GlobalEventMap>(
    type: K,
    listener: (this: EventTarget, ev: GlobalEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof GlobalEventMap>(
    type: K,
    listener: (this: EventTarget, ev: GlobalEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  dispatchEvent(event: Event): boolean;
};
