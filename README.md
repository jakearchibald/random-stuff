# Simple static & functions Cloudflare project

This is a Cloudflare "Workers & Pages" project.
You can set it up to publish on push to GitHub, or manually via `pnpm run publish`.

For each request, it will:

1. If the equivalent path is in `public`, it's served. Index files are served, e.g. `public/foo/index.html` will be served for requests to `/foo/`.
2. Otherwise, if the request ends in `/`, and there's an equivalent route function (eg `/hello/` will check for `src/routes/hello/index.ts`), that function is called to get the response.
3. Otherwise, 404.

[`public/_headers`](https://developers.cloudflare.com/pages/configuration/headers/) and [`public/_redirects`](https://developers.cloudflare.com/pages/configuration/redirects/) are supported.

A root `/index.html` is generated, providing a list of top level URLs. Titles are 'scraped' from `<title>` in HTML, or `// title: Hello!` in route modules.

## Running & developing

To install:

```sh
pnpm i
```

To dev:

```sh
pnpm run dev
```

To deploy, push to GitHub, or:

```sh
pnpm run deploy
```

I guess `npm` will work too.
