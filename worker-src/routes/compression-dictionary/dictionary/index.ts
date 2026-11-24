import { dictionary } from '../data.ts';

const route: ExportedHandler<Env>['fetch'] = async () => {
  return new Response(dictionary, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      // Tells the browser to keep this response as a dictionary for matching requests.
      'Use-As-Dictionary': 'match="/compression-dictionary/resource/*"',
      // The dictionary lives as long as the HTTP cache entry.
      'Cache-Control': 'max-age=3600',
    },
  });
};

export default route;
