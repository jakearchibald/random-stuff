const mover = document.querySelector('.mover');
const panner = document.querySelector('.panner');

let dragging = false;
let startX, startY, startLeft, startTop;

panner.addEventListener('pointerdown', (event) => {
  dragging = true;
  startX = event.clientX;
  startY = event.clientY;
  startLeft = mover.offsetLeft;
  startTop = mover.offsetTop;
  panner.setPointerCapture(event.pointerId);
  event.preventDefault();
});

panner.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  mover.style.left = startLeft + (event.clientX - startX) + 'px';
  mover.style.top = startTop + (event.clientY - startY) + 'px';
});

panner.addEventListener('pointerup', () => {
  dragging = false;
});
