const moduleBPromise = import('./module-b.js');
const moduleABPromise = import('./module-c.js');

moduleBPromise.then(
  () => {
    document.body.textContent = 'It worked';
  },
  (e) => {
    document.body.textContent = e;
  }
);
