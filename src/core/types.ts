import type { Camera, Scene, WebGLRenderer } from "three";
import type { EventBus } from "./EventBus";
import type { InputSystem } from "./InputSystem";

export type QualityTier = "low" | "medium" | "high" | "ultra";

export interface RuntimeOptions {
  canvas: HTMLCanvasElement;
  uiRoot: HTMLElement;
  quality?: QualityTier;
  /** Keep an explicitly requested tier stable for QA and user overrides. */
  adaptiveQuality?: boolean;
  fixedStepSeconds?: number;
  maxPixelRatio?: number;
}

export interface FrameInfo {
  readonly nowSeconds: number;
  readonly deltaSeconds: number;
  readonly elapsedSeconds: number;
  readonly frame: number;
}

export interface FixedFrameInfo extends FrameInfo {
  readonly fixedDeltaSeconds: number;
}

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

export interface CoreEvents {
  "runtime:started": undefined;
  "runtime:stopped": undefined;
  "viewport:resize": ViewportSize;
  "quality:changed": QualityTier;
  "performance:sample": PerformanceSample;
}

export interface PerformanceSample {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

export interface EngineContext {
  readonly canvas: HTMLCanvasElement;
  readonly uiRoot: HTMLElement;
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  camera: Camera;
  readonly input: InputSystem;
  readonly events: EventBus<CoreEvents>;
  readonly viewport: ViewportSize;
  quality: QualityTier;
}

export interface GameModule {
  readonly id: string;
  init(context: EngineContext): void | Promise<void>;
  update?(frame: FrameInfo, context: EngineContext): void;
  fixedUpdate?(frame: FixedFrameInfo, context: EngineContext): void;
  lateUpdate?(frame: FrameInfo, context: EngineContext): void;
  dispose?(context: EngineContext): void;
}

export type ModuleFactory = () => GameModule;
