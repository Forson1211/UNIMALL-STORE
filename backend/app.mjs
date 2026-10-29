import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { authRouter, sessionMiddleware } from './auth.mjs';
import { commerceRpc } from './commerce.mjs';
import { commerceAnalytics } from './analytics.mjs';
import { listManagedVendors, mutateQuery, readQuery } from './queries.mjs';
import { ApiError, approved, cleanObject, fail, hasRole, identity, timestamp } from './security.mjs';

export function createApp({ db, client, config, sendMail }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (origin === config.origin) return true;
    if (config.production && origin.endsWith('.vercel.app')) return true;
    return false;
  };

  app.use((req, _res, next) => {
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    next();
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: {
    directives: { imgSrc: ["'self'", 'https:', 'data:', 'blob:'], fontSrc: ["'self'", 'https:', 'data:'], styleSrc: ["'self'", "'unsafe-inline'", 'https:'] },
  } }));
  app.use(cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.get('/api/health', async (_req, res) => { await db.command({ ping: 1 }); res.json({ status: 'ok', database: 'mongodb' }); });
  app.use('/api', (req, res, next) => {
    const origin = req.get('origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isAllowedOrigin(origin)) return next(new ApiError(403, 'Request origin is not allowed.'));
    res.set('Cache-Control', 'no-store');
    try { if (req.is('application/json')) req.body = cleanObject(req.body); next(); } catch (error) { next(error); }
  });
  const apiLimit = rateLimit({ windowMs: 60000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false });
  const authLimit = rateLimit({ windowMs: 900000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
  app.use('/api', apiLimit, sessionMiddleware(db, config));
  app.use('/api/auth', (req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : authLimit(req, res, next), authRouter({ db, client, config, sendMail }));

  app.post('/api/query', async (req, res) => {
    if (!req.is('application/json') || typeof req.body.table !== 'string' || (req.body.selection && (typeof req.body.selection !== 'string' || req.body.selection.length > 3000))) fail(400, 'Invalid query.');
    const context = { db, client, user: req.user };
    const result = req.body.operation && req.body.operation !== 'select' ? await mutateQuery(context, req.body) : await readQuery(db, req.user, req.body);
    res.json({ ...result, error: null });
  });
  app.post('/api/actions/:name', async (req, res) => {
    const params = req.body || {};
    let data;
    if (req.params.name === 'get_vendor_sales_insights') data = await commerceAnalytics(db, req.user, 'vendor', params);
    else if (req.params.name === 'get_admin_analytics') data = await commerceAnalytics(db, req.user, 'admin', params);
    else if (req.params.name === 'list_managed_vendors') data = await listManagedVendors(db, req.user);
    else if (['get_admin_weekly_revenue', 'get_admin_analytics_charts'].includes(req.params.name)) {
      if (!hasRole(req.user, 'admin', 'moderator', 'order_manager')) fail(403, 'Only sales staff can view revenue analytics.');
      const orders = await db.collection('orders').find({ status: 'delivered', payment_status: { $in: ['paid', 'completed'] } }).toArray();
      const series = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(); date.setUTCHours(0, 0, 0, 0); date.setUTCDate(date.getUTCDate() - (6 - i));
        const key = date.toISOString().slice(0, 10);
        return { name: date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }), revenue: orders.filter(o => o.created_at.startsWith(key)).reduce((sum, o) => sum + Math.round(o.total_amount * 100), 0) / 100 };
      });
      data = req.params.name === 'get_admin_weekly_revenue' ? series : { revenue_data: series, growth_data: [] };
    } else data = await commerceRpc({ db, client, user: req.user }, req.params.name, params);
    if (data === undefined) fail(404, 'Unknown server action.');
    res.json({ data, error: null });
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 5 * 1024 * 1024, fields: 4 } });
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  const imageType = bytes => {
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
    if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    if (/^GIF8[79]a/.test(bytes.toString('ascii', 0, 6))) return 'image/gif';
    fail(400, 'Upload a PNG, JPEG, WebP or GIF image.');
  };
  const pathValue = value => {
    if (typeof value !== 'string' || value.length > 500 || value.split('/').some(part => !part || part === '..' || part === '.') || [...value].some(character => character === '\\' || character.charCodeAt(0) < 32)) fail(400, 'Invalid storage path.');
    return value;
  };
  app.post('/api/storage/:bucket', upload.single('file'), async (req, res) => {
    const userId = identity(req.user);
    const name = req.params.bucket, path = pathValue(req.body.path);
    if (name === 'products') {
      const onboardingImage = req.user.role === 'vendor' && req.user.vendor_status === 'pending' && path.startsWith(userId + '/store/');
      if ((!approved(req.user) && !onboardingImage) || !path.startsWith(userId + '/')) fail(403, 'Upload images to your own seller folder.');
    }
    else if (name === 'site-assets') { if (!hasRole(req.user, 'admin', 'content_manager')) fail(403, 'Only content staff can upload site assets.'); }
    else fail(400, 'Unknown storage bucket.');
    if (!req.file) fail(400, 'Choose an image file.');
    const contentType = imageType(req.file.buffer);
    const existing = await db.collection('uploads').findOne({ bucket: name, path });
    if (existing && existing.user_id !== userId && !hasRole(req.user, 'admin')) fail(403, 'This image belongs to another account.');
    const stream = bucket.openUploadStream(`${name}/${path}`, { metadata: { contentType, user_id: userId } });
    await streamPipeline(Readable.from(req.file.buffer), stream);
    try {
      await db.collection('uploads').updateOne({ bucket: name, path }, { $set: { grid_id: stream.id, content_type: contentType, user_id: userId, size: req.file.size, updated_at: timestamp() }, $setOnInsert: { id: crypto.randomUUID(), bucket: name, path } }, { upsert: true });
    } catch (error) { await bucket.delete(stream.id); throw error; }
    if (existing?.grid_id) await bucket.delete(existing.grid_id).catch(() => {});
    res.status(201).json({ data: { path }, error: null });
  });
  app.get('/api/storage/:bucket/file', async (req, res) => {
    const path = pathValue(req.query.path);
    const file = await db.collection('uploads').findOne({ bucket: req.params.bucket, path });
    if (!file) fail(404, 'Image not found.');
    res.set({ 'Content-Type': file.content_type, 'Content-Length': String(file.size), 'Cache-Control': 'public, max-age=86400', 'Content-Security-Policy': "default-src 'none'; sandbox" });
    await streamPipeline(bucket.openDownloadStream(file.grid_id), res);
  });
  app.post('/api/storage/:bucket/remove', async (req, res) => {
    identity(req.user);
    if (!Array.isArray(req.body.paths) || req.body.paths.length > 50) fail(400, 'Invalid image selection.');
    for (const item of req.body.paths) {
      const path = pathValue(item);
      const file = await db.collection('uploads').findOne({ bucket: req.params.bucket, path });
      if (!file) continue;
      if (file.user_id !== req.user.id && !hasRole(req.user, 'admin')) fail(403, 'This image belongs to another account.');
      await bucket.delete(file.grid_id); await db.collection('uploads').deleteOne({ id: file.id });
    }
    res.json({ data: [], error: null });
  });
  app.use('/api', (_req, _res, next) => next(new ApiError(404, 'Unknown API endpoint.')));
  if (config.production) {
    const dist = fileURLToPath(new URL('../dist/', import.meta.url));
    app.use(express.static(dist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) return next();
      res.sendFile('index.html', { root: dist });
    });
  }
  app.use((error, _req, res, _next) => {
    if (res.headersSent) return res.end();
    const duplicate = error.code === 11000;
    const status = error instanceof ApiError ? error.status : duplicate ? 409 : error instanceof multer.MulterError ? 400 : error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : 500;
    if (status >= 500) console.error('API request failed:', error.name, error.code || '');
    res.status(status).json({ data: null, error: { message: status === 500 ? 'The server could not complete this request.' : duplicate ? 'This record already exists.' : error.type === 'entity.parse.failed' ? 'Invalid JSON request.' : error.message, code: error instanceof ApiError ? error.code : duplicate ? 'DUPLICATE_RECORD' : 'SERVER_ERROR' } });
  });
  return app;
}
