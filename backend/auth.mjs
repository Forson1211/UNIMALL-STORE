import { Router } from 'express';
import nodemailer from 'nodemailer';
import { transact } from './db.mjs';
import { ApiError, digest, token, emailAddress, hashPassword, verifyPassword, publicUser, text, timestamp, identity, fail } from './security.mjs';
import { notify } from './commerce.mjs';

export function mailDelivery(config) {
  const transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null;
  return async ({ to, subject, body }) => {
    if (!transport || !config.mailFrom) fail(503, 'Email delivery is not configured. Set SMTP_URL and MAIL_FROM on the server.');
    await transport.sendMail({ from: config.mailFrom, to, subject, text: body });
  };
}

export function sessionMiddleware(db, config) {
  return async (req, _res, next) => {
    try {
      const raw = req.cookies?.[config.cookieName];
      req.user = null; req.accountSession = null;
      if (typeof raw === 'string' && raw.length < 128) {
        const session = await db.collection('sessions').findOne({ token_hash: digest(raw), expires_at: { $gt: new Date() } });
        if (session) {
          const user = await db.collection('users').findOne({ id: session.user_id, disabled: { $ne: true } });
          if (user) { req.user = user; req.accountSession = session; }
        }
      }
      next();
    } catch (error) { next(error); }
  };
}

export function authRouter({ db, client, config, sendMail = mailDelivery(config) }) {
  const router = Router();
  const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'lax', path: '/' };
  const responseSession = user => user ? { user: publicUser(user), expires_at: Math.floor(Date.now() / 1000) + config.sessionDays * 86400 } : null;
  const issueSession = async (res, user) => {
    const raw = token();
    await db.collection('sessions').insertOne({ id: crypto.randomUUID(), user_id: user.id, token_hash: digest(raw), authenticated_at: new Date(), expires_at: new Date(Date.now() + config.sessionDays * 86400000) });
    res.cookie(config.cookieName, raw, { ...cookieOptions, maxAge: config.sessionDays * 86400000 });
    return responseSession(user);
  };
  const issueEmailToken = async (user, purpose) => {
    const raw = token();
    await db.collection('auth_tokens').deleteMany({ user_id: user.id, purpose });
    await db.collection('auth_tokens').insertOne({ id: crypto.randomUUID(), user_id: user.id, purpose, token_hash: digest(raw), expires_at: new Date(Date.now() + 1800000) });
    const path = purpose === 'reset' ? '/reset-password#token=' : '/login#verify=';
    await sendMail({ to: user.email, subject: purpose === 'reset' ? 'Reset your Unimall password' : 'Verify your Unimall account', body: `Open this link within 30 minutes:\n${config.origin}${path}${raw}\n\nIf you did not request this, ignore this email.` });
  };

  router.get('/session', (req, res) => res.json({ session: responseSession(req.user) }));
  router.get('/user', (req, res) => { identity(req.user); res.json({ user: publicUser(req.user) }); });
  router.post('/signup', async (req, res) => {
    const email = emailAddress(req.body.email);
    const password_hash = await hashPassword(req.body.password);
    const metadata = req.body.options?.data || {};
    if (!['buyer', 'vendor'].includes(metadata.role)) fail(400, 'Choose a buyer or vendor account.');
    const full_name = text(metadata.full_name, 'full name', 2, 120);
    const store_name = metadata.role === 'vendor' ? text(metadata.store_name || full_name, 'store name', 2, 120) : null;
    const id = crypto.randomUUID();
    const created_at = timestamp();
    const user = { id, email, password_hash, full_name, store_name, role: metadata.role, vendor_status: metadata.role === 'vendor' ? 'pending' : null,
      email_verified: !config.requireEmailVerification, created_at, commerce_version: 0 };
    if (metadata.role === 'vendor') {
      const setting = await db.collection('site_settings').findOne({ setting_key: 'allow_vendor_registration' });
      if (setting?.setting_value === false) fail(403, 'Vendor registration is currently closed.');
    }
    try {
      await transact(client, async session => {
        await db.collection('users').insertOne(user, { session });
        await db.collection('profiles').insertOne({ id: crypto.randomUUID(), user_id: id, full_name, store_name, verified: false, rating: 0, created_at, updated_at: created_at, notification_preferences: {} }, { session });
        if (user.role === 'vendor') {
          const reviewers = await db.collection('users').find({ role: { $in: ['admin', 'vendor_manager'] }, disabled: { $ne: true } }, { session }).toArray();
          for (const reviewer of reviewers) await notify(db, session, reviewer.id, 'vendor_applications', 'New vendor application', `${store_name} is awaiting staff review.`, '/admin/vendors');
        }
      });
    } catch (error) {
      if (error.code === 11000) throw new ApiError(409, 'An account with this email already exists.');
      throw error;
    }
    let verificationEmailSent = false;
    if (config.requireEmailVerification) {
      try { await issueEmailToken(user, 'verify'); verificationEmailSent = true; }
      catch { console.error('Account created, but verification email delivery failed. The user can request another email.'); }
    }
    res.status(201).json({ user: publicUser(user), session: null, verificationRequired: config.requireEmailVerification, verificationEmailSent });
  });
  router.post('/resend-verification', async (req, res) => {
    if (!config.smtpUrl || !config.mailFrom) fail(503, 'Email delivery is not configured. Contact support.');
    const email = emailAddress(req.body.email);
    const user = await db.collection('users').findOne({ email, email_verified: false, disabled: { $ne: true } });
    if (user) {
      try { await issueEmailToken(user, 'verify'); }
      catch { console.error('Verification email resend failed. Check server email delivery.'); }
    }
    res.json({ message: 'If this account needs verification, an email will be sent. Check your inbox and spam folder.' });
  });
  router.post('/login', async (req, res) => {
    const email = emailAddress(req.body.email);
    const user = await db.collection('users').findOne({ email });
    const valid = await verifyPassword(req.body.password, user?.password_hash);
    if (!valid || !user || user.disabled) fail(401, 'Email or password is incorrect.');
    if (config.requireEmailVerification && !user.email_verified) fail(403, 'Verify your email before signing in.', 'EMAIL_NOT_VERIFIED');
    if (req.accountSession) await db.collection('sessions').deleteOne({ id: req.accountSession.id });
    await db.collection('users').updateOne({ id: user.id }, { $set: { last_sign_in_at: timestamp() } });
    res.json({ user: publicUser(user), session: await issueSession(res, user) });
  });
  router.post('/logout', async (req, res) => {
    if (req.accountSession) await db.collection('sessions').deleteOne({ id: req.accountSession.id });
    res.clearCookie(config.cookieName, cookieOptions); res.json({});
  });
  router.post('/recovery', async (req, res) => {
    if (!config.smtpUrl || !config.mailFrom) fail(503, 'Email delivery is not configured. Set SMTP_URL and MAIL_FROM on the server.');
    const email = emailAddress(req.body.email);
    const user = await db.collection('users').findOne({ email, disabled: { $ne: true } });
    if (user) await issueEmailToken(user, 'reset');
    res.json({ message: 'If this account exists, a recovery email has been sent.' });
  });
  router.post('/reset', async (req, res) => {
    const password_hash = await hashPassword(req.body.password);
    const token_hash = digest(text(req.body.token, 'recovery token', 32, 128));
    await transact(client, async session => {
      const saved = await db.collection('auth_tokens').findOne({ token_hash, purpose: 'reset', expires_at: { $gt: new Date() } }, { session });
      if (!saved) fail(400, 'This recovery link has expired or was already used.');
      await db.collection('auth_tokens').deleteOne({ id: saved.id }, { session });
      await db.collection('users').updateOne({ id: saved.user_id, disabled: { $ne: true } }, { $set: { password_hash, email_verified: true } }, { session });
      await db.collection('sessions').deleteMany({ user_id: saved.user_id }, { session });
    });
    res.clearCookie(config.cookieName, cookieOptions); res.json({});
  });
  router.post('/password', async (req, res) => {
    const userId = identity(req.user);
    if (Date.now() - new Date(req.accountSession.authenticated_at).getTime() > 300000) fail(403, 'Sign in again with your current password before changing it.');
    const password_hash = await hashPassword(req.body.password);
    await transact(client, async session => {
      await db.collection('users').updateOne({ id: userId }, { $set: { password_hash } }, { session });
      await db.collection('sessions').deleteMany({ user_id: userId }, { session });
    });
    res.json({ user: publicUser(req.user), session: await issueSession(res, req.user) });
  });
  router.post('/verify', async (req, res) => {
    const saved = await db.collection('auth_tokens').findOneAndDelete({ token_hash: digest(text(req.body.token, 'verification token', 32, 128)), purpose: 'verify', expires_at: { $gt: new Date() } });
    if (!saved) fail(400, 'This verification link has expired or was already used.');
    await db.collection('users').updateOne({ id: saved.user_id }, { $set: { email_verified: true } });
    res.json({});
  });
  return router;
}
