// title: Used by other tests - creates a slow redirect
const route: ExportedHandler<Env>['fetch'] = async (request, env, ctx) => {
  const url = new URL(request.url);
  const to = url.searchParams.get('to');
  const wait = Number(url.searchParams.get('wait') ?? 1000);

  if (!to) {
    return new Response('No `to`', {
      status: 400,
    });
  }

  if (wait > 10_000) {
    return new Response('Wait too long', {
      status: 400,
    });
  }

  // Wait for the specified duration
  await new Promise((resolve) => setTimeout(resolve, wait));

  // Resolve 'to' against the referrer
  const referrer = request.headers.get('Referer') || url.origin;
  const redirectUrl = new URL(to, referrer);

  return Response.redirect(redirectUrl.href, 302);
};

export default route;
