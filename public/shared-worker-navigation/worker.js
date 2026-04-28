const workerNumber = Math.random();

self.addEventListener('connect', (event) => {
  const port = event.ports[0];
  port.postMessage(workerNumber);
});
