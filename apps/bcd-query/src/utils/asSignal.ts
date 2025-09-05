import { type Signal, useSignal } from '@preact/signals';

export function asSignal<T>(value: T): Signal<T> {
  const signal = useSignal(value);

  if (signal.value !== value) {
    signal.value = value;
  }

  return signal;
}
