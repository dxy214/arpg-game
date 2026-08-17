import {
  ACESFilmicToneMapping,
  Color,
  PCFSoftShadowMap,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import type { QualityTier, ViewportSize } from "./types";

const TIER_PIXEL_RATIO: Record<QualityTier, number> = {
  low: 0.65,
  medium: 1.1,
  // High-density 3D canvases scale quadratically. These caps retain clean
  // desktop presentation while leaving enough GPU headroom for combat VFX.
  high: 1.25,
  ultra: 1.5,
};

export class RendererHost {
  readonly renderer: WebGLRenderer;
  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    quality: QualityTier,
    private readonly maxPixelRatio: number,
    onResize: (viewport: ViewportSize) => void,
  ) {
    const context = canvas.getContext("webgl2", {
      alpha: false,
      antialias: quality !== "low",
      depth: true,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      stencil: false,
    });

    if (!context) throw new Error("Veilfall requires WebGL2.");

    this.renderer = new WebGLRenderer({ canvas, context, antialias: quality !== "low" });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    // Keep a little more room in the nocturnal mid-tones before the game module
    // applies its scene-specific grade. ACES still protects spell/fire highlights.
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.shadowMap.enabled = quality !== "low";
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setClearColor(new Color(0x172631), 1);

    this.resizeObserver = new ResizeObserver(() => onResize(this.resize(quality)));
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
  }

  resize(quality: QualityTier): ViewportSize {
    const parent = this.canvas.parentElement;
    const width = Math.max(1, parent?.clientWidth ?? window.innerWidth);
    const height = Math.max(1, parent?.clientHeight ?? window.innerHeight);
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      this.maxPixelRatio,
      TIER_PIXEL_RATIO[quality],
    );
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    return { width, height, pixelRatio };
  }

  setQuality(quality: QualityTier): ViewportSize {
    this.renderer.shadowMap.enabled = quality !== "low";
    return this.resize(quality);
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
