import('../../utils/html.js').then(({ html }) => {
  const data = document.documentElement;
  const htmlEl = document.createElementNS(
    'http://www.w3.org/1999/xhtml',
    'html'
  );
  data.replaceWith(htmlEl);

  const bookHTML = (bookEl) => html`
    <div>
      <span class="title">
        ${bookEl.querySelector(':scope > title').textContent}
      </span>
      -
      <span class="author">
        ${bookEl.parentNode.querySelector(':scope > name').textContent}
      </span>
    </div>

    <div>
      <span class="genre">
        Genre: ${bookEl.querySelector(':scope > genre').textContent}
      </span>
    </div>
  `;

  htmlEl.setHTMLUnsafe(html`
    <head>
      <title>Book Collection</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
      <h1>Book Collection</h1>
      <ul>
        ${[...data.querySelectorAll('book')].map(
          (book) => html`<li>${bookHTML(book)}</li>`
        )}
      </ul>
    </body>
  `);
});
