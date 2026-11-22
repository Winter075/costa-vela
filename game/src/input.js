// Keyboard and pointer state, sampled once per frame by the main loop.
const down = new Set();
const tapped = new Set();

export const cursor = {
  x: 0,
  y: 0,
  firing: false,
  orbiting: false,
  dx: 0,
  dy: 0,
};

const blocked = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

export function listen(canvas) {
  window.addEventListener('keydown', (event) => {
    if (!down.has(event.code)) tapped.add(event.code);
    down.add(event.code);
    if (blocked.has(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => down.delete(event.code));
  window.addEventListener('blur', () => {
    down.clear();
    cursor.firing = false;
    cursor.orbiting = false;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('mousedown', (event) => {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    if (event.button === 0) cursor.firing = true;
    if (event.button === 2) {
      cursor.orbiting = true;
      cursor.dx = 0;
      cursor.dy = 0;
    }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) cursor.firing = false;
    if (event.button === 2) cursor.orbiting = false;
  });
  window.addEventListener('mousemove', (event) => {
    if (cursor.orbiting) {
      cursor.dx += event.clientX - cursor.x;
      cursor.dy += event.clientY - cursor.y;
    }
    cursor.x = event.clientX;
    cursor.y = event.clientY;
  });
}

export function held(code) {
  return down.has(code);
}

export function pressed(code) {
  return tapped.has(code);
}

export function clearFrameInput() {
  tapped.clear();
  cursor.dx = 0;
  cursor.dy = 0;
}
