// input.js — keyboard, mouse-drag orbit and click-to-fire, kept separate from game rules.

export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.justPressed = new Set();
    this.orbitX = 0;
    this.orbitY = 0;
    this.fireRequested = false;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.enabled = true;

    window.addEventListener('keydown', (event) => {
      if (!this.enabled) return;
      if (!this.down.has(event.code)) this.justPressed.add(event.code);
      this.down.add(event.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => this.down.delete(event.code));
    window.addEventListener('blur', () => { this.down.clear(); this.dragging = false; });

    canvas.addEventListener('pointerdown', (event) => {
      if (!this.enabled || event.button !== 0) return;
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging || !this.enabled) return;
      this.orbitX += event.clientX - this.lastX;
      this.orbitY += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    canvas.addEventListener('pointerup', (event) => {
      if (!this.dragging) return;
      const moved = Math.abs(event.clientX - this.lastX) + Math.abs(event.clientY - this.lastY);
      if (moved < 6 && this.enabled) this.fireRequested = true;
      this.dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  isDown(code) { return this.down.has(code); }
  wasPressed(code) { return this.justPressed.has(code); }

  consumeFire() {
    const value = this.fireRequested || this.down.has('ControlLeft');
    this.fireRequested = false;
    return value;
  }

  consumeOrbit() {
    const value = { x: this.orbitX, y: this.orbitY };
    this.orbitX = 0;
    this.orbitY = 0;
    if (this.isDown('ArrowLeft')) value.x -= 14;
    if (this.isDown('ArrowRight')) value.x += 14;
    if (this.isDown('ArrowUp')) value.y -= 10;
    if (this.isDown('ArrowDown')) value.y += 10;
    return value;
  }

  endFrame() { this.justPressed.clear(); }
}
