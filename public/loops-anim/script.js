// Configuration
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const STROKE_WIDTH = 20;
const MIN_SPACE = 40;

/**
 * Generate random circles that don't overlap
 */
function generateCircles() {
  const circles = [];

  createCircles: while (true) {
    let x;
    let y;
    let r;
    let miss = 0;

    randomCircle: while (true) {
      x = Math.random() * WIDTH;
      y = Math.random() * HEIGHT;
      r = 400;

      for (const circle of circles) {
        const xDiff = circle.x - x;
        const yDiff = circle.y - y;
        const distance = Math.sqrt(xDiff ** 2 + yDiff ** 2);
        const space = distance - circle.r;

        if (space > -MIN_SPACE && space < MIN_SPACE) {
          // Circle is too close
          miss++;
          if (miss > 200) {
            break createCircles;
          }
          continue randomCircle;
        }

        r = Math.min(Math.abs(space) - STROKE_WIDTH, r);
      }

      break;
    }

    circles.push({ x, y, r });
  }

  // Sort circles by size (largest first)
  circles.sort((a, b) => b.r - a.r);

  return circles;
}

/**
 * Create an SVG circle element with a small rotating rectangle
 */
function createCircleElement(circle, index) {
  const boxSize = 20;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('rotator');
  svg.setAttribute('width', circle.r * 2 + STROKE_WIDTH);
  svg.setAttribute('height', circle.r * 2 + STROKE_WIDTH);

  // Create circle
  const circleEl = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle'
  );
  circleEl.setAttribute('cx', circle.r + STROKE_WIDTH / 2);
  circleEl.setAttribute('cy', circle.r + STROKE_WIDTH / 2);
  circleEl.setAttribute('r', circle.r);

  // Create rotating rectangle
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', circle.r + STROKE_WIDTH / 2 - boxSize / 2);
  rect.setAttribute('y', STROKE_WIDTH / 2 - boxSize / 2);
  rect.setAttribute('width', boxSize);
  rect.setAttribute('height', boxSize);

  svg.appendChild(circleEl);
  svg.appendChild(rect);

  // Wrap in scaler div for scale animation
  const scaler = document.createElement('div');
  scaler.classList.add('scaler');
  scaler.style.animationDelay = `${index * 200}ms`;
  scaler.appendChild(svg);

  // Wrap in positioner div for positioning and initial rotation
  const positioner = document.createElement('div');
  positioner.classList.add('positioner');
  const randomRotation = Math.random() * 360;
  positioner.style.transform = `translate(${
    circle.x - circle.r - STROKE_WIDTH / 2
  }px, ${
    circle.y - circle.r - STROKE_WIDTH / 2
  }px) rotate(${randomRotation}deg)`;
  positioner.appendChild(scaler);

  return positioner;
}

/**
 * Initialize the animation
 */
function init() {
  const container = document.createElement('div');
  container.id = 'looping-bg';

  const zoomer = document.createElement('div');
  zoomer.classList.add('zoomer');

  const circles = generateCircles();

  circles.forEach((circle, index) => {
    const element = createCircleElement(circle, index);
    zoomer.appendChild(element);
  });

  container.appendChild(zoomer);
  document.body.appendChild(container);
}

init();
