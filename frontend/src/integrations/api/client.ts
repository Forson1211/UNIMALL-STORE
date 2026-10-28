export interface User {
  id: string; email: string; created_at?: string; email_confirmed_at?: string | null;
  user_metadata: { full_name?: string; store_name?: string; [key: string]: unknown };
}
export interface Session { user: User; expires_at?: number }
export interface ApiResult { data: any; error: (Error & { code?: string; status?: number }) | null; count?: number }
const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const changes = new EventTarget();
const authListeners = new Set<(event: string, session: Session | null) => void>();
let verification: { token: string; promise: Promise<ApiResult> } | undefined;
const changed = (table?: string) => changes.dispatchEvent(new CustomEvent('change', { detail: { table } }));

async function request(path: string, body?: unknown, options: { signal?: AbortSignal; method?: string; form?: FormData } = {}): Promise<ApiResult> {
  try {
    const response = await fetch(base + path, {
      method: options.method || (body !== undefined || options.form ? 'POST' : 'GET'), credentials: 'include',
      headers: options.form ? undefined : { 'Content-Type': 'application/json' },
      body: options.form || (body !== undefined ? JSON.stringify(body) : undefined),
      signal: options.signal || AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || typeof result !== 'object' || result.error) {
      const error = Object.assign(new Error(result?.error?.message || (response.status === 429 ? 'Too many requests. Please try again shortly.' : 'The API is unavailable. Start the server and check its configuration.')), { code: result?.error?.code, status: response.status });
      return { data: null, error };
    }
    return { data: result, error: null };
  } catch (cause) {
    return { data: null, error: cause instanceof Error ? cause : new Error('Could not reach the API.') };
  }
}

class ResourceQuery implements PromiseLike<ApiResult> {
  private spec: Record<string, any>;
  private signal?: AbortSignal;
  private promise?: Promise<ApiResult>;
  constructor(table: string) { this.spec = { table, operation: 'select', selection: '*', filters: [], orders: [] }; }
  select(selection = '*', options?: { count?: string; head?: boolean }) { this.spec.selection = selection; this.spec.head = options?.head; return this; }
  insert(values: unknown) { this.spec.operation = 'insert'; this.spec.values = values; return this; }
  update(values: unknown) { this.spec.operation = 'update'; this.spec.values = values; return this; }
  upsert(values: unknown, _options?: unknown) { this.spec.operation = 'upsert'; this.spec.values = values; return this; }
  delete() { this.spec.operation = 'delete'; return this; }
  eq(field: string, value: unknown) { this.spec.filters.push({ op: 'eq', field, value }); return this; }
  is(field: string, value: unknown) { this.spec.filters.push({ op: 'is', field, value }); return this; }
  in(field: string, value: unknown[]) { this.spec.filters.push({ op: 'in', field, value }); return this; }
  ilike(field: string, value: string) { this.spec.filters.push({ op: 'ilike', field, value }); return this; }
  contains(field: string, value: unknown[]) { this.spec.filters.push({ op: 'contains', field, value }); return this; }
  or(value: string) { this.spec.filters.push({ op: 'or', value }); return this; }
  order(field: string, options?: { ascending?: boolean; [key: string]: unknown }) { this.spec.orders.push({ field, ascending: options?.ascending !== false }); return this; }
  range(from: number, to: number) { this.spec.offset = from; this.spec.limit = to - from + 1; return this; }
  limit(value: number) { this.spec.limit = value; return this; }
  single() { this.spec.single = 'one'; return this; }
  maybeSingle() { this.spec.single = 'maybe'; return this; }
  abortSignal(signal: AbortSignal) { this.signal = signal; return this; }
  then<TResult1 = ApiResult, TResult2 = never>(onfulfilled?: ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    this.promise ||= request('/query', this.spec, { signal: this.signal }).then(result => {
      if (result.error) return result;
      if (this.spec.operation !== 'select') changed(this.spec.table);
      return { data: result.data.data, error: null, count: result.data.count };
    });
    return this.promise.then(onfulfilled, onrejected);
  }
}

function notifyAuth(event: string, session: Session | null) {
  authListeners.forEach(listener => listener(event, session));
  try { localStorage.setItem('unimall_auth_changed', String(Date.now())); } catch { /* Cross-tab notification is optional. */ }
}
const auth = {
  async getSession() {
    let emailVerified = false;
    const verify = new URLSearchParams(window.location.hash.slice(1)).get('verify');
    if (verify) {
      if (verification?.token !== verify) verification = { token: verify, promise: request('/auth/verify', { token: verify }) };
      const verified = await verification.promise;
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (verified.error) return { data: { session: null, emailVerified: false }, error: Object.assign(verified.error, { code: 'EMAIL_VERIFICATION_FAILED' }) };
      emailVerified = true;
    }
    const result = await request('/auth/session');
    return { data: { session: (result.data?.session || null) as Session | null, emailVerified }, error: result.error };
  },
  async getUser() { const result = await request('/auth/user'); return { data: { user: result.data?.user as User | null }, error: result.error }; },
  onAuthStateChange(listener: (event: string, session: Session | null) => void) {
    authListeners.add(listener);
    const sync = async (event: StorageEvent) => {
      if (event.key === 'unimall_auth_changed') { const { data, error } = await auth.getSession(); if (!error) listener(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session); }
    };
    window.addEventListener('storage', sync);
    return { data: { subscription: { unsubscribe: () => { authListeners.delete(listener); window.removeEventListener('storage', sync); } } } };
  },
  async signUp(values: unknown) {
    const result = await request('/auth/signup', values);
    return { data: result.data, error: result.error };
  },
  async signInWithPassword(values: { email: string; password: string }) {
    const result = await request('/auth/login', values);
    if (!result.error) notifyAuth('SIGNED_IN', result.data.session);
    return { data: result.data, error: result.error };
  },
  async signOut() {
    const result = await request('/auth/logout', {});
    if (!result.error) notifyAuth('SIGNED_OUT', null);
    return { error: result.error };
  },
  async updateUser(values: { password: string }) {
    const result = await request('/auth/password', values);
    if (!result.error) notifyAuth('USER_UPDATED', result.data.session);
    return { data: result.data, error: result.error };
  },
  async resetPasswordForEmail(email: string, _options?: unknown) { const result = await request('/auth/recovery', { email }); return { data: result.data, error: result.error }; },
  async resendVerificationEmail(email: string) { const result = await request('/auth/resend-verification', { email }); return { data: result.data, error: result.error }; },
  async resetPassword(token: string, password: string) { const result = await request('/auth/reset', { token, password }); if (!result.error) notifyAuth('SIGNED_OUT', null); return { error: result.error }; },
};

class RefreshSubscription {
  private callbacks: Array<{ table?: string; callback: (event: any) => void }> = [];
  private timer?: ReturnType<typeof setInterval>;
  private onChange = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    new Set(this.callbacks.filter(item => !detail?.table || !item.table || item.table === detail.table).map(item => item.callback)).forEach(callback => callback({ eventType: 'REFRESH' }));
  };
  on(_event: string, filter: { table?: string; [key: string]: unknown }, callback: (event: any) => void) { this.callbacks.push({ table: filter.table, callback }); return this; }
  subscribe(callback?: (status: string) => void) {
    changes.addEventListener('change', this.onChange);
    this.timer = setInterval(() => { if (document.visibilityState !== 'hidden') this.onChange(new Event('refresh')); }, 15000);
    callback?.('SUBSCRIBED'); return this;
  }
  unsubscribe() { clearInterval(this.timer); changes.removeEventListener('change', this.onChange); }
  async send(_value: unknown) { changed(); return 'ok'; }
}

export const api = {
  from: (table: string) => new ResourceQuery(table),
  async rpc(name: string, params: unknown = {}): Promise<ApiResult> {
    const result = await request('/actions/' + encodeURIComponent(name), params);
    if (result.error) return result;
    if (!name.startsWith('get_') && !name.startsWith('list_') && name !== 'quote_checkout') changed();
    return { data: result.data.data, error: null };
  },
  auth,
  storage: {
    from(bucket: string) {
      const storageBase = '/storage/' + encodeURIComponent(bucket);
      return {
        async upload(path: string, file: File, _options?: unknown): Promise<ApiResult> {
          const form = new FormData(); form.append('path', path); form.append('file', file);
          const result = await request(storageBase, undefined, { form });
          return result.error ? result : { data: result.data.data, error: null };
        },
        getPublicUrl(path: string) {
          const relative = `${base}${storageBase}/file?path=${encodeURIComponent(path)}`;
          return { data: { publicUrl: new URL(relative, window.location.origin).href } };
        },
        async remove(paths: string[]): Promise<ApiResult> {
          const result = await request(storageBase + '/remove', { paths });
          return result.error ? result : { data: result.data.data, error: null };
        },
      };
    },
  },
  channel(_name: string) { return new RefreshSubscription(); },
  removeChannel(channel: RefreshSubscription) { channel.unsubscribe(); return Promise.resolve(); },
};
