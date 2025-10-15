const searchParams = new URLSearchParams(location.search);
const timeout = Number(searchParams.get('timeout')) || '0';
await new Promise((r) => setTimeout(r, timeout));
export const someConst = 'someConst';
