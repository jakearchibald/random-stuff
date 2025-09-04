export function classes(obj: { [key: string]: boolean }) {
  return Object.entries(obj)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(' ');
}
