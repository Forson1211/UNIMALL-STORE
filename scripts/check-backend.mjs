// Read-only API health check. Does not print credentials or customer records.
const apiUrl = process.env.BACKEND_CHECK_URL || 'http://127.0.0.1:4000/api';
try {
  const response = await fetch(apiUrl.replace(/\/$/, '') + '/health', { signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  const ok = response.ok && body.status === 'ok' && body.database === 'mongodb';
  console.log(JSON.stringify({ status: ok ? 'ok' : 'unavailable', database: 'mongodb', httpStatus: response.status }));
  if (!ok) process.exitCode = 1;
} catch {
  console.error('MongoDB API is unavailable. Configure backend/.env and run npm run server.');
  process.exitCode = 1;
}
