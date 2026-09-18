let memorySubscriptions: Record<string, unknown> = {};

export function clearMemorySubscriptions() {
  memorySubscriptions = {};
}

export function getMemorySubscriptions<T extends Record<string, unknown>>() {
  return memorySubscriptions as T;
}

export function setMemorySubscriptions<T extends Record<string, unknown>>(value: T) {
  memorySubscriptions = value;
}
