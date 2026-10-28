import { api } from './client';

const fetchMock = vi.fn();
beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); });
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

it('sends credentials and query filters, and runs a query only once', async () => {
  fetchMock.mockResolvedValue(response({ data: [{ id: 'p' }], count: 1 }));
  const query = api.from('products').select('id').eq('vendor_id', 'seller').order('created_at', { ascending: false }).range(0, 9);
  const [one, two] = await Promise.all([query, query]);
  expect(one).toEqual({ data: [{ id: 'p' }], error: null, count: 1 });
  expect(two).toEqual(one);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/query'); expect(options.credentials).toBe('include');
  expect(JSON.parse(options.body)).toMatchObject({ table: 'products', filters: [{ op: 'eq', field: 'vendor_id', value: 'seller' }], offset: 0, limit: 10 });
});
it('returns server failures and rejects HTML responses from a missing API proxy', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { message: 'Stock changed', code: 'CONFLICT' } }, 409));
  expect((await api.rpc('create_order_v2', {})).error).toMatchObject({ message: 'Stock changed', status: 409, code: 'CONFLICT' });
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new SyntaxError('HTML'); } });
  expect((await api.from('products').select()).error?.message).toContain('API is unavailable');
});
it('does not emit a signed-in event when login fails', async () => {
  const listener = vi.fn();
  const { data: { subscription } } = api.auth.onAuthStateChange(listener);
  try {
    fetchMock.mockResolvedValue(response({ error: { message: 'Invalid password' } }, 401));
    expect((await api.auth.signInWithPassword({ email: 'buyer@example.com', password: 'bad' })).error).toBeTruthy();
    expect(listener).not.toHaveBeenCalled();
  } finally { subscription.unsubscribe(); }
});

it('consumes an email verification token once when session restoration overlaps', async () => {
  history.replaceState(null, '', '/login#verify=single-use-token');
  fetchMock.mockImplementation(async (path: string) => response(path.endsWith('/auth/session') ? { session: null } : {}));
  const results = await Promise.all([api.auth.getSession(), api.auth.getSession()]);
  expect(results.every(result => result.data.emailVerified)).toBe(true);
  expect(fetchMock.mock.calls.filter(([path]) => path.endsWith('/auth/verify'))).toHaveLength(1);
  expect(window.location.hash).toBe(''); history.replaceState(null, '', '/');
});
