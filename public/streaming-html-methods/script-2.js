// Served via /slow-redirect/ with only a 500ms delay, so it's ready long before
// script-1.js. It should still run second, in document order.
(() => {
  const output = document.querySelector('#output');

  demoLog('script-2.js executing');
  demoLog(`script-2.js sees: ${JSON.stringify(output.textContent.trim())}`);

  const p = document.createElement('p');
  p.className = 'from-script';
  p.textContent = '4. Appended by script-2.js';
  output.append(p);
})();
