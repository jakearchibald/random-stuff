const moduleBPromise = import('./module-b.js');
const moduleABPromise = import('./module-c.js');

moduleBPromise.then(
  () => {
    document.querySelector('.result').textContent = 'It worked';
  },
  (e) => {
    document.querySelector('.result').textContent = e;
  }
);
