interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  medianTime: number;
  p95Time: number;
  p99Time: number;
  throughput: number;
  success: boolean;
  errors: number;
}

interface BenchmarkOptions {
  warmupIterations?: number;
  iterations?: number;
  concurrency?: number;
  maxDuration?: number;
}

export async function benchmark(
  name: string,
  fn: () => Promise<void> | void,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const { warmupIterations = 3, iterations = 100, concurrency = 1, maxDuration = 30000 } = options;

  for (let warmupIdx = 0; warmupIdx < warmupIterations; warmupIdx++) {
    await fn();
  }

  const times: number[] = [];
  let errors = 0;
  const startTime = performance.now();

  if (concurrency === 1) {
    for (let iterIdx = 0; iterIdx < iterations; iterIdx++) {
      if (performance.now() - startTime > maxDuration) break;

      const iterStart = performance.now();
      try {
        await fn();
        times.push(performance.now() - iterStart);
      } catch {
        errors++;
      }
    }
  } else {
    const batches = Math.ceil(iterations / concurrency);
    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      if (performance.now() - startTime > maxDuration) break;

      const batchSize = Math.min(concurrency, iterations - batchIdx * concurrency);
      const batchStart = performance.now();

      const promises = Array.from({ length: batchSize }, async () => {
        try {
          await fn();
        } catch {
          errors++;
        }
      });

      await Promise.all(promises);
      times.push(performance.now() - batchStart);
    }
  }

  const totalTime = performance.now() - startTime;

  if (times.length === 0) {
    return {
      name,
      iterations: 0,
      totalTime,
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
      medianTime: 0,
      p95Time: 0,
      p99Time: 0,
      throughput: 0,
      success: false,
      errors,
    };
  }

  const sorted = [...times].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? max;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? max;

  return {
    name,
    iterations: times.length * (concurrency === 1 ? 1 : concurrency),
    totalTime,
    avgTime: avg,
    minTime: min,
    maxTime: max,
    medianTime: median,
    p95Time: p95,
    p99Time: p99,
    throughput: (times.length / totalTime) * 1000,
    success: errors === 0,
    errors,
  };
}

export function formatResult(result: BenchmarkResult): string {
  const lines = [
    `┌─ ${result.name}`,
    `│ Iterations: ${result.iterations}`,
    `│ Total:      ${result.totalTime.toFixed(2)}ms`,
    `│ Avg:        ${result.avgTime.toFixed(2)}ms`,
    `│ Min:        ${result.minTime.toFixed(2)}ms`,
    `│ Max:        ${result.maxTime.toFixed(2)}ms`,
    `│ Median:     ${result.medianTime.toFixed(2)}ms`,
    `│ P95:        ${result.p95Time.toFixed(2)}ms`,
    `│ P99:        ${result.p99Time.toFixed(2)}ms`,
    `│ Throughput: ${result.throughput.toFixed(2)} ops/sec`,
    `│ Success:    ${result.success ? "PASS" : "FAIL"} (${result.errors} errors)`,
    "└─────────────────────────────",
  ];
  return lines.join("\n");
}

export function assertPerformance(
  result: BenchmarkResult,
  threshold: number,
  metric: "avgTime" | "p95Time" | "p99Time" = "avgTime"
): boolean {
  const value = result[metric];
  const pass = value <= threshold;
  if (!pass) {
    console.error(
      `PERFORMANCE FAILURE: ${result.name} ${metric}=${value.toFixed(2)}ms exceeds threshold ${threshold}ms`
    );
  }
  return pass;
}
