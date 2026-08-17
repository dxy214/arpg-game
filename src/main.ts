import { GameRuntime } from "./core/GameRuntime";
import { VerticalSliceModule } from "./integration/VerticalSliceModule";
import { PerformanceProbe } from "./testing/PerformanceProbe";
import type { QualityTier } from "./core/types";
import "./core/global.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const uiRoot = document.querySelector<HTMLElement>("#game-ui");

if (!canvas || !uiRoot) {
  throw new Error("Veilfall could not find its required canvas and UI roots.");
}

const params = new URLSearchParams(window.location.search);
const requestedQuality = params.get("quality");
const forcedQuality: QualityTier | undefined = requestedQuality === "low" || requestedQuality === "medium" || requestedQuality === "high" || requestedQuality === "ultra"
  ? requestedQuality
  : undefined;
const qaBaseline = params.get("perf") === "1" && params.get("baseline") === "1";
const runtime = new GameRuntime({
  canvas,
  uiRoot,
  quality: forcedQuality,
  adaptiveQuality: forcedQuality === undefined,
});

canvas.dataset.focus = document.hasFocus() ? "focused" : "blurred";
window.addEventListener("blur", () => { canvas.dataset.focus = "blurred"; });
window.addEventListener("focus", () => { canvas.dataset.focus = "focused"; });

if (!qaBaseline) runtime.addModule(new VerticalSliceModule());
if (params.get("perf") === "1") {
  runtime.addModule(new PerformanceProbe());
}
runtime.start();

// The read-only reference supports automated smoke tests and frame diagnostics.
Object.defineProperty(window, "__VEILFALL__", { value: runtime, writable: false });

declare global {
  interface Window {
    readonly __VEILFALL__: GameRuntime;
  }
}
