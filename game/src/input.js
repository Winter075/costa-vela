// Keyboard and mouse state. Edge-triggered actions are consumed once per press.

export class Input {
  constructor(canvas) {
    this.held = new Set();
    this.pressed = new Set();
    this.dragging = false;
    this.dragX = 0;
    this.orbit = 0;
    this.fire = false;
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.held.has(key)) this.pressed.add(key);
      this.held.add(key);
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.held.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.held.clear(); this.dragging = false; });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.fire = true;
      if (e.button === 2) { this.dragging = true; this.dragX = e.clientX; }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.fire = false;
      if (e.button === 2) this.dragging = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (this.dragging) { this.orbit += (e.clientX - this.dragX) * 0.006; this.dragX = e.clientX; }
    });
  }

  down(key) { return this.held.has(key); }

  take(key) {
    if (!this.pressed.has(key)) return false;
    this.pressed.delete(key);
    return true;
  }

  endFrame() { this.pressed.clear(); }
}
