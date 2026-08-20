// title: Proxies the latest browser-compat-data, with CORS headers
const dataURL =
  'https://github.com/mdn/browser-compat-data/releases/download/next/data.json';

const route: ExportedHandler<Env>['fetch'] = async (request, env, ctx) => {
  const response = await fetch(dataURL);

  if (!response.ok) {
    return new Response(`Upstream error: ${response.status}`, {
      status: 502,
    });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/json',
      // Cache on the CDN for an hour, but let the browser revalidate.
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};

export default route;
