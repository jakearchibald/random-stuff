import { useEffect } from 'preact/hooks';

export function useChangeEffect(
  ...[callback, deps]: Parameters<typeof useEffect>
) {
  let firstRun = true;

  useEffect(() => {
    if (firstRun) {
      firstRun = false;
      return;
    }
    return callback();
  }, deps);
}
