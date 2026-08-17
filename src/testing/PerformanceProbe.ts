import type { EngineContext, FrameInfo, GameModule } from '../core/types';

const SAMPLE_SECONDS = 30;
const UPDATE_INTERVAL_SECONDS = 1;

type Snapshot = {
  objects: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
};

function percentile(sorted: readonly number[], quantile: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * quantile))] ?? 0;
}

/** QA-only, visible telemetry. Register only when `?perf=1` is present. */
export class PerformanceProbe implements GameModule {
  readonly id = 'qa-performance-probe';
  private readonly samples: number[] = [];
  private element?: HTMLElement;
  private context?: EngineContext;
  private startedAt = 0;
  private previousFrameAt = 0;
  private nextUiUpdateAt = 0;
  private sampling = false;
  private complete = false;
  private startSnapshot?: Snapshot;

  init(context: EngineContext): void {
    this.context = context;
    const baseline = new URLSearchParams(window.location.search).get('baseline') === '1';
    this.element = document.createElement('aside');
    this.element.id = 'qa-performance';
    this.element.dataset.status = 'armed';
    this.element.setAttribute('aria-live', 'polite');
    this.element.style.cssText = [
      'position:fixed', 'z-index:9999', 'top:10px', 'right:10px', 'width:330px',
      'padding:12px 14px', 'background:rgba(3,6,10,.92)', 'border:1px solid #7ce7ff',
      'color:#dffcff', 'font:12px/1.45 ui-monospace,SFMono-Regular,monospace',
      'white-space:pre-wrap', 'pointer-events:none', 'box-shadow:0 8px 32px #000b',
    ].join(';');
    document.body.append(this.element);
    window.addEventListener('keydown', this.onKeyDown);
    this.renderArmed();
    if (baseline) this.element.dataset.baseline = 'true';
  }

  update(frame: FrameInfo): void {
    if (!this.sampling || !this.context || !this.element) return;
    if (this.previousFrameAt > 0) this.samples.push((frame.nowSeconds - this.previousFrameAt) * 1000);
    this.previousFrameAt = frame.nowSeconds;
    const elapsed = frame.nowSeconds - this.startedAt;
    if (elapsed >= SAMPLE_SECONDS) {
      this.sampling = false;
      this.complete = true;
      this.element.dataset.status = 'complete';
      this.renderSample(SAMPLE_SECONDS);
      return;
    }
    if (elapsed >= this.nextUiUpdateAt) {
      this.nextUiUpdateAt += UPDATE_INTERVAL_SECONDS;
      this.renderProgress(elapsed);
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.element?.remove();
    this.element = undefined;
    this.context = undefined;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== 'KeyP' || event.repeat) return;
    this.begin();
  };

  private begin(): void {
    if (!this.context || !this.element) return;
    this.samples.length = 0;
    this.startedAt = performance.now() / 1000;
    this.previousFrameAt = 0;
    this.nextUiUpdateAt = 0;
    this.sampling = true;
    this.complete = false;
    this.startSnapshot = this.snapshot();
    this.element.dataset.status = 'sampling';
    delete this.element.dataset.result;
    this.renderProgress(0);
  }

  private renderArmed(): void {
    if (!this.element) return;
    this.element.textContent = 'QA PERFORMANCE · ARMED\nPress P in the desired stress case\nto begin a real 30-second sample.';
  }

  private renderProgress(elapsed: number): void {
    if (!this.context || !this.element) return;
    const renderer = this.context.renderer;
    const liveFps = this.context.canvas.dataset.fps ?? '—';
    this.element.textContent = [
      'QA PERFORMANCE · SAMPLING',
      `${elapsed.toFixed(1)} / ${SAMPLE_SECONDS.toFixed(1)} s · ${this.samples.length} frames`,
      `LIVE ${liveFps} FPS`,
      `DRAW ${renderer.info.render.calls} calls · ${renderer.info.render.triangles.toLocaleString()} tris`,
      'Full statistics and resource deltas compute once at completion.',
      'Do not switch tabs during capture.',
    ].join('\n');
  }

  private renderSample(elapsed: number): void {
    if (!this.context || !this.element) return;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const averageMs = this.samples.length > 0 ? this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length : 0;
    const slowCount = Math.max(1, Math.ceil(sorted.length * 0.01));
    const slowest = sorted.slice(-slowCount);
    const slowAverageMs = slowest.length > 0 ? slowest.reduce((sum, value) => sum + value, 0) / slowest.length : 0;
    // Full scene traversal and sample sorting intentionally happen only once,
    // after capture, so the probe does not manufacture periodic frame spikes.
    const end = this.snapshot();
    const gl = this.context.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const result = {
      seconds: Number(elapsed.toFixed(2)),
      samples: this.samples.length,
      averageFps: averageMs > 0 ? Number((1000 / averageMs).toFixed(2)) : 0,
      onePercentLowFps: slowAverageMs > 0 ? Number((1000 / slowAverageMs).toFixed(2)) : 0,
      frameMs: {
        median: Number(percentile(sorted, 0.5).toFixed(2)),
        p95: Number(percentile(sorted, 0.95).toFixed(2)),
        p99: Number(percentile(sorted, 0.99).toFixed(2)),
        max: Number((sorted.at(-1) ?? 0).toFixed(2)),
      },
      start: this.startSnapshot,
      end,
      delta: this.startSnapshot ? {
        objects: end.objects - this.startSnapshot.objects,
        geometries: end.geometries - this.startSnapshot.geometries,
        textures: end.textures - this.startSnapshot.textures,
        programs: end.programs - this.startSnapshot.programs,
      } : undefined,
      quality: this.context.quality,
      viewport: { ...this.context.viewport },
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
        webglVersion: String(gl.getParameter(gl.VERSION)),
        webglRenderer: String(gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER)),
        webglVendor: String(gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR)),
      },
    };
    if (this.complete) this.element.dataset.result = JSON.stringify(result);
    this.element.textContent = [
      `QA PERFORMANCE · ${this.complete ? 'COMPLETE' : 'SAMPLING'}`,
      `${result.seconds.toFixed(1)} / ${SAMPLE_SECONDS.toFixed(1)} s · ${result.samples} frames`,
      `AVG ${result.averageFps.toFixed(1)} FPS · 1% LOW ${result.onePercentLowFps.toFixed(1)} FPS`,
      `FRAME ms  med ${result.frameMs.median.toFixed(2)}  p95 ${result.frameMs.p95.toFixed(2)}  p99 ${result.frameMs.p99.toFixed(2)}  max ${result.frameMs.max.toFixed(2)}`,
      `DRAW ${end.calls} calls · ${end.triangles.toLocaleString()} tris`,
      `GPU MEM ${end.geometries} geo · ${end.textures} tex · ${end.programs} programs`,
      `SCENE ${end.objects} objects${result.delta ? ` · Δ${result.delta.objects >= 0 ? '+' : ''}${result.delta.objects}` : ''}`,
      `QUALITY ${result.quality.toUpperCase()} · ${result.viewport.width}×${result.viewport.height} @ ${result.viewport.pixelRatio.toFixed(2)}`,
      `GPU ${result.environment.webglRenderer}`,
      this.complete ? 'Press P to retest.' : 'Do not switch tabs during capture.',
    ].join('\n');
  }

  private snapshot(): Snapshot {
    if (!this.context) return { objects: 0, calls: 0, triangles: 0, geometries: 0, textures: 0, programs: 0 };
    let objects = 0;
    this.context.scene.traverse(() => { objects += 1; });
    const renderer = this.context.renderer;
    return {
      objects,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length ?? 0,
    };
  }
}
