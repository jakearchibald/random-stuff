// Served via /slow-redirect/ with a 2000ms delay, and executed by the fragment
// parser that streamHTMLUnsafe() created. IIFE so re-running the demo doesn't
// hit a global redeclaration.
(() => {
  const output = document.querySelector('#output');

  demoLog('script-1.js executing');
  demoLog(`script-1.js sees: ${JSON.stringify(output.textContent.trim())}`);

  const p = document.createElement('p');
  p.className = 'from-script';
  p.textContent = '2. Appended by script-1.js';
  output.append(p);
})();
