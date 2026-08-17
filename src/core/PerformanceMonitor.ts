import type { WebGLRenderer } from "three";
import type { PerformanceSample } from "./types";

export class PerformanceMonitor {
  private accumulatedSeconds = 0;
  private accumulatedFrames = 0;

  update(deltaSeconds: number, renderer: WebGLRenderer): PerformanceSample | undefined {
    this.accumulatedSeconds += deltaSeconds;
    this.accumulatedFrames += 1;
    if (this.accumulatedSeconds < 0.5) return undefined;

    const sample: PerformanceSample = {
      fps: this.accumulatedFrames / this.accumulatedSeconds,
      frameTimeMs: (this.accumulatedSeconds / this.accumulatedFrames) * 1000,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    };
    this.accumulatedSeconds = 0;
    this.accumulatedFrames = 0;
    return sample;
  }
}
