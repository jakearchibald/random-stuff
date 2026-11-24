const route: ExportedHandler<Env>['fetch'] = async () => {
  // Clearing the cache also clears stored compression dictionaries.
  return new Response('Cleared', {
    headers: {
      'Clear-Site-Data': '"cache"',
      'Cache-Control': 'no-store',
    },
  });
};

export default route;
