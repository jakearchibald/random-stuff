const routeModules = import.meta.glob('./**/index.ts') as Record<
  string,
  () => Promise<{ default: NonNullable<ExportedHandler<Env>['fetch']> }>
>;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Fix missing trailing slash.
    if (
      !url.pathname.endsWith('/') &&
      routeModules['./routes' + url.pathname + '/index.ts']
    ) {
      return Response.redirect(new URL(url.pathname + '/', url).href);
    }

    const route = routeModules['./routes' + url.pathname + 'index.ts'];

    if (!route) return new Response('Not found', { status: 404 });

    const module = await route();

    if (!('default' in module)) {
      throw new Error(
        `Route module for ${url.pathname} is missing default export`
      );
    }

    if (typeof module.default !== 'function') {
      throw new Error(
        `Route module for ${url.pathname} default export is not a function`
      );
    }

    return module.default(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
