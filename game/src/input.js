// Costa Vela keyboard and mouse input. Held keys, one-shot presses and orbit drag live here.

const BLOCKED = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.fireHeld = false;
    this.firePressed = false;
    this.dragDX = 0;
    this.dragDY = 0;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.enabled = true;

    window.addEventListener('keydown', (event) => {
      if (BLOCKED.has(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.held.add(event.code);
    });
    window.addEventListener('keyup', (event) => this.held.delete(event.code));
    window.addEventListener('blur', () => { this.held.clear(); this.dragging = false; });

    canvas.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this.fireHeld = true;
        this.firePressed = true;
        this.dragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
      } else if (event.button === 2) {
        this.dragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
      }
    });
    window.addEventListener('mouseup', (event) => {
      this.fireHeld = false;
      this.dragging = false;
      if (event.button === 2) this.dragging = false;
    });
    window.addEventListener('mousemove', (event) => {
      if (!this.dragging) return;
      this.dragDX += event.clientX - this.lastX;
      this.dragDY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  isDown(code) { return this.held.has(code); }

  consume(code) {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }

  consumeFire() {
    const value = this.firePressed;
    this.firePressed = false;
    return value;
  }

  takeOrbit() {
    const delta = { x: this.dragDX, y: this.dragDY };
    this.dragDX = 0;
    this.dragDY = 0;
    return delta;
  }

  endFrame() {
    this.pressed.clear();
    this.firePressed = false;
  }

  // Movement axes used by both driving and on-foot mode.
  axes() {
    let x = 0;
    let z = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) z -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) z += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    return { x, z };
  }
}
