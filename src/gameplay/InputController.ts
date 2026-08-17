import { Vector2 } from 'three';

/** Frame-accurate desktop input with action buffering handled by PlayerController. */
export class InputController {
  private readonly heldKeys = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly heldButtons = new Set<number>();
  private readonly pressedButtons = new Set<number>();
  readonly pointerNdc = new Vector2();

  constructor(private readonly domElement: HTMLElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('contextmenu', this.preventContextMenu);
  }

  get movementX(): number {
    return Number(this.down('KeyD')) - Number(this.down('KeyA'));
  }

  get movementY(): number {
    return Number(this.down('KeyW')) - Number(this.down('KeyS'));
  }

  down(code: string): boolean {
    return this.heldKeys.has(code);
  }

  pressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  buttonDown(button: number): boolean {
    return this.heldButtons.has(button);
  }

  buttonPressed(button: number): boolean {
    return this.pressedButtons.has(button);
  }

  endFrame(): void {
    this.pressedKeys.clear();
    this.pressedButtons.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('contextmenu', this.preventContextMenu);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.heldKeys.has(event.code)) this.pressedKeys.add(event.code);
    this.heldKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.heldKeys.delete(event.code);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.heldButtons.has(event.button)) this.pressedButtons.add(event.button);
    this.heldButtons.add(event.button);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.heldButtons.delete(event.button);
  };

  private readonly onBlur = (): void => {
    this.heldKeys.clear();
    this.heldButtons.clear();
  };

  private readonly preventContextMenu = (event: Event): void => event.preventDefault();
}
