import { useSignal } from '@preact/signals';
import { type FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';

interface Props {
  img: Blob;
  onAgain: () => void;
}

const iterations = 50;

interface BenchResults {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  totalTime: number;
}

const BenchDecode: FunctionalComponent<Props> = ({ img, onAgain }) => {
  const results = useSignal<null | BenchResults | Error>(null);

  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      const times: number[] = [];
      const overallStart = performance.now();

      try {
        for (
          let i = 0;
          i < iterations && !abortController.signal.aborted;
          i++
        ) {
          const start = performance.now();
          const imageBitmap = await createImageBitmap(img);
          imageBitmap.close();
          const end = performance.now();
          times.push(end - start);
        }
      } catch (error) {
        results.value = error as Error;
        return;
      }

      if (abortController.signal.aborted) return;

      const overallEnd = performance.now();
      const totalTime = overallEnd - overallStart;

      // Calculate mean
      const mean = times.reduce((sum, t) => sum + t, 0) / times.length;

      // Calculate median
      const sorted = [...times].sort((a, b) => a - b);
      const median =
        sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];

      // Calculate standard deviation
      const variance =
        times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);

      // Get min and max
      const min = Math.min(...times);
      const max = Math.max(...times);

      results.value = {
        mean,
        median,
        stdDev,
        min,
        max,
        totalTime,
      };
    })();

    return () => {
      abortController.abort();
    };
  }, [img]);

  if (!results.value) return <p>Benchmarking…</p>;
  if (results.value instanceof Error) {
    return <p>Error during benchmark: {results.value.message}</p>;
  }
  return (
    <div>
      <p>Mean: {results.value.mean.toFixed(2)}ms</p>
      <p>Median: {results.value.median.toFixed(2)}ms</p>
      <p>Std Dev: {results.value.stdDev.toFixed(2)}ms</p>
      <p>Min: {results.value.min.toFixed(2)}ms</p>
      <p>Max: {results.value.max.toFixed(2)}ms</p>
      <p>Total Time: {results.value.totalTime.toFixed(2)}ms</p>
      <button onClick={onAgain}>Again!</button>
    </div>
  );
};

export default BenchDecode;
