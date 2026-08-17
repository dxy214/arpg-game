export interface PointerSnapshot {
  readonly clientX: number;
  readonly clientY: number;
  readonly normalizedX: number;
  readonly normalizedY: number;
  readonly buttons: number;
  readonly wheelDelta: number;
  readonly inside: boolean;
}

export class InputSystem {
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();
  private wheelDelta = 0;
  private pointerState: PointerSnapshot = {
    clientX: 0,
    clientY: 0,
    normalizedX: 0,
    normalizedY: 0,
    buttons: 0,
    wheelDelta: 0,
    inside: false,
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.held.has(event.code)) this.pressed.add(event.code);
    this.held.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code);
    this.released.add(event.code);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointerState = {
      clientX: event.clientX,
      clientY: event.clientY,
      normalizedX: ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1,
      normalizedY: -(((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1),
      buttons: event.buttons,
      wheelDelta: this.wheelDelta,
      inside: true,
    };
  };

  private readonly onPointerLeave = (): void => {
    this.pointerState = { ...this.pointerState, inside: false };
  };

  private readonly onWheel = (event: WheelEvent): void => {
    this.wheelDelta += event.deltaY;
  };

  private readonly onBlur = (): void => {
    this.held.clear();
    this.pressed.clear();
    this.released.clear();
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: true });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  isHeld(code: string): boolean {
    return this.held.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  wasReleased(code: string): boolean {
    return this.released.has(code);
  }

  get pointer(): PointerSnapshot {
    return { ...this.pointerState, wheelDelta: this.wheelDelta };
  }

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
    this.wheelDelta = 0;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
  }
}
