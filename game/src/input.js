// Keyboard and pointer state. The loop reads this once per frame.
const held = new Set();
const tapped = new Set();

export const pointer = {
  x: 0,
  y: 0,
  left: false,
  right: false,
  dragging: false,
  dx: 0,
  dy: 0,
};

const swallow = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

export function initInput(canvas) {
  window.addEventListener('keydown', (event) => {
    if (!held.has(event.code)) tapped.add(event.code);
    held.add(event.code);
    if (swallow.has(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => {
    held.clear();
    pointer.left = false;
    pointer.right = false;
    pointer.dragging = false;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('mousedown', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (event.button === 0) pointer.left = true;
    if (event.button === 2) {
      pointer.right = true;
      pointer.dragging = true;
      pointer.dx = 0;
      pointer.dy = 0;
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) pointer.left = false;
    if (event.button === 2) {
      pointer.right = false;
      pointer.dragging = false;
    }
  });
  window.addEventListener('mousemove', (event) => {
    if (pointer.dragging) {
      pointer.dx += event.clientX - pointer.x;
      pointer.dy += event.clientY - pointer.y;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
}

export function isDown(code) {
  return held.has(code);
}

export function wasPressed(code) {
  return tapped.has(code);
}

export function endFrame() {
  tapped.clear();
  pointer.dx = 0;
  pointer.dy = 0;
}
