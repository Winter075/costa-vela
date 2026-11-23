// input.js — keyboard and mouse translated into game intent, with no game rules here.

const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.lookX = 0;
    this.lookY = 0;
    this.fireQueued = false;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.enabled = true;

    window.addEventListener('keydown', (event) => {
      if (!this.enabled) return;
      if (!this.held.has(event.code)) this.pressed.add(event.code);
      this.held.add(event.code);
      if (PREVENT.has(event.code)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => this.held.delete(event.code));
    window.addEventListener('blur', () => { this.held.clear(); this.dragging = false; });

    canvas.addEventListener('pointerdown', (event) => {
      if (!this.enabled || event.button !== 0) return;
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.enabled || !this.dragging) return;
      this.lookX += event.clientX - this.lastX;
      this.lookY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    canvas.addEventListener('pointerup', (event) => {
      if (!this.dragging) return;
      const travel = Math.abs(event.clientX - this.lastX) + Math.abs(event.clientY - this.lastY);
      if (travel < 7 && this.enabled) this.fireQueued = true;
      this.dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
    });
  }

  isDown(code) { return this.held.has(code); }
  wasPressed(code) { return this.pressed.has(code); }

  consumeFire() {
    const fire = this.fireQueued || this.held.has('ControlLeft');
    this.fireQueued = false;
    return fire;
  }

  consumeOrbit() {
    const delta = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    if (this.held.has('ArrowLeft')) delta.x -= 15;
    if (this.held.has('ArrowRight')) delta.x += 15;
    if (this.held.has('ArrowUp')) delta.y -= 11;
    if (this.held.has('ArrowDown')) delta.y += 11;
    return delta;
  }

  endFrame() { this.pressed.clear(); }
}
