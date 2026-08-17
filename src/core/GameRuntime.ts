import { Clock, PerspectiveCamera, Scene } from "three";
import { EventBus } from "./EventBus";
import { InputSystem } from "./InputSystem";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { RendererHost } from "./RendererHost";
import type {
  CoreEvents,
  EngineContext,
  FixedFrameInfo,
  FrameInfo,
  GameModule,
  QualityTier,
  RuntimeOptions,
} from "./types";

export class GameRuntime {
  readonly events = new EventBus<CoreEvents>();
  readonly scene = new Scene();
  readonly input: InputSystem;
  readonly context: EngineContext;

  private readonly rendererHost: RendererHost;
  private readonly clock = new Clock(false);
  private readonly monitor = new PerformanceMonitor();
  private readonly modules: GameModule[] = [];
  private readonly fixedStepSeconds: number;
  private readonly adaptiveQuality: boolean;
  private accumulatorSeconds = 0;
  private elapsedSeconds = 0;
  private frame = 0;
  private animationFrame = 0;
  private running = false;
  private starting = false;
  private slowPerformanceSamples = 0;

  constructor(options: RuntimeOptions) {
    const quality = options.quality ?? this.detectQuality();
    this.fixedStepSeconds = options.fixedStepSeconds ?? 1 / 60;
    this.adaptiveQuality = options.adaptiveQuality ?? true;
    this.input = new InputSystem(options.canvas);

    const camera = new PerspectiveCamera(40, 1, 0.1, 500);
    camera.position.set(10, 12, 10);
    camera.lookAt(0, 0, 0);

    const viewport = { width: 1, height: 1, pixelRatio: 1 };
    this.rendererHost = new RendererHost(
      options.canvas,
      quality,
      options.maxPixelRatio ?? 2,
      (nextViewport) => {
        Object.assign(viewport, nextViewport);
        this.updateCameraAspect(nextViewport.width, nextViewport.height);
        this.events.emit("viewport:resize", nextViewport);
      },
    );

    this.context = {
      canvas: options.canvas,
      uiRoot: options.uiRoot,
      renderer: this.rendererHost.renderer,
      scene: this.scene,
      camera,
      input: this.input,
      events: this.events,
      viewport,
      quality,
    };
    Object.assign(viewport, this.rendererHost.resize(quality));
    this.updateCameraAspect(viewport.width, viewport.height);
  }

  addModule(module: GameModule): void {
    if (this.running || this.starting) throw new Error("Modules must be registered before start().");
    if (this.modules.some(({ id }) => id === module.id)) {
      throw new Error(`Duplicate game module id: ${module.id}`);
    }
    this.modules.push(module);
  }

  async start(): Promise<void> {
    if (this.running || this.starting) return;
    this.starting = true;
    try {
      for (const module of this.modules) await module.init(this.context);
      this.running = true;
      this.clock.start();
      this.events.emit("runtime:started", undefined);
      this.animationFrame = requestAnimationFrame(this.tick);
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.clock.stop();
    this.events.emit("runtime:stopped", undefined);
  }

  setQuality(quality: QualityTier): void {
    if (quality === this.context.quality) return;
    this.context.quality = quality;
    const viewport = this.rendererHost.setQuality(quality);
    Object.assign(this.context.viewport, viewport);
    this.events.emit("quality:changed", quality);
    this.events.emit("viewport:resize", viewport);
  }

  dispose(): void {
    this.stop();
    for (const module of [...this.modules].reverse()) module.dispose?.(this.context);
    this.modules.length = 0;
    this.input.dispose();
    this.events.clear();
    this.rendererHost.dispose();
  }

  private readonly tick = (): void => {
    if (!this.running) return;
    const deltaSeconds = Math.min(this.clock.getDelta(), 0.1);
    this.elapsedSeconds += deltaSeconds;
    this.accumulatorSeconds += deltaSeconds;
    this.frame += 1;
    const nowSeconds = performance.now() / 1000;
    const frame: FrameInfo = {
      nowSeconds,
      deltaSeconds,
      elapsedSeconds: this.elapsedSeconds,
      frame: this.frame,
    };

    for (const module of this.modules) module.update?.(frame, this.context);

    let fixedSteps = 0;
    while (this.accumulatorSeconds >= this.fixedStepSeconds && fixedSteps < 3) {
      const fixedFrame: FixedFrameInfo = {
        ...frame,
        deltaSeconds: this.fixedStepSeconds,
        fixedDeltaSeconds: this.fixedStepSeconds,
      };
      for (const module of this.modules) module.fixedUpdate?.(fixedFrame, this.context);
      this.accumulatorSeconds -= this.fixedStepSeconds;
      fixedSteps += 1;
    }
    // A suspended/backgrounded tab must not repay an unbounded simulation debt
    // on focus, which would amplify one hitch into a long frame cascade.
    if (this.accumulatorSeconds >= this.fixedStepSeconds) {
      this.accumulatorSeconds %= this.fixedStepSeconds;
    }

    for (const module of this.modules) module.lateUpdate?.(frame, this.context);
    this.context.renderer.render(this.context.scene, this.context.camera);
    const sample = this.monitor.update(deltaSeconds, this.context.renderer);
    if (sample) {
      // Keep lightweight live telemetry on the canvas for browser QA and field
      // diagnostics without adding a visible debug overlay to the game HUD.
      this.context.canvas.dataset.fps = sample.fps.toFixed(1);
      this.context.canvas.dataset.frameMs = sample.frameTimeMs.toFixed(2);
      this.context.canvas.dataset.drawCalls = String(sample.drawCalls);
      this.context.canvas.dataset.triangles = String(sample.triangles);
      this.context.canvas.dataset.quality = this.context.quality;
      this.events.emit("performance:sample", sample);
      this.adaptQuality(sample.fps);
    }
    this.input.endFrame();
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private adaptQuality(fps: number): void {
    if (!this.adaptiveQuality) return;
    // Two consecutive one-second misses indicate sustained pressure rather than
    // a transient compile, resize, or tab-focus hitch. Step down until the
    // browser can protect combat responsiveness; never oscillate upward during
    // the same play session.
    this.slowPerformanceSamples = fps < 48
      ? this.slowPerformanceSamples + 1
      : Math.max(0, this.slowPerformanceSamples - 1);
    if (this.slowPerformanceSamples < 2) return;
    const next: QualityTier | undefined = this.context.quality === "ultra"
      ? "high"
      : this.context.quality === "high"
        ? "medium"
        : this.context.quality === "medium"
          ? "low"
          : undefined;
    if (!next) return;
    this.slowPerformanceSamples = 0;
    this.setQuality(next);
  }

  private updateCameraAspect(width: number, height: number): void {
    if (!(this.context?.camera instanceof PerspectiveCamera)) return;
    this.context.camera.aspect = width / Math.max(height, 1);
    this.context.camera.updateProjectionMatrix();
  }

  private detectQuality(): QualityTier {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    if (cores >= 12 && memory >= 8) return "ultra";
    if (cores >= 8 && memory >= 4) return "high";
    if (cores >= 4) return "medium";
    return "low";
  }
}
