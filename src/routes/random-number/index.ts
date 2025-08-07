// title: Returns a random number
const route: ExportedHandler<Env>['fetch'] = async (request, env, ctx) => {
  return new Response(`${Math.random()}`);
};

export default route;
