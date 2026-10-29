import { getServers, setServers } from 'node:dns';
import { Resolver } from 'node:dns/promises';

// Atlas uses SRV records. Some campus networks intermittently reject one resolver.
// Probe independently before changing this Node process's resolver; never alter OS DNS.
export async function configureMongoDns(config) {
  if (!config.uri?.startsWith('mongodb+srv://') || config.uri.includes('<')) return;
  const hostname = new URL(config.uri).hostname;
  const candidates = [config.dnsServers || [], getServers(), ['1.1.1.1'], ['8.8.8.8']].filter(servers => servers.length);
  const seen = new Set();
  for (const servers of candidates) {
    const key = servers.join(','); if (seen.has(key)) continue; seen.add(key);
    const resolver = new Resolver({ timeout: 2000, tries: 1 });
    try {
      resolver.setServers(servers);
      const records = await resolver.resolveSrv('_mongodb._tcp.' + hostname);
      if (!records.length) continue;
      await resolver.resolveTxt(hostname).catch(error => { if (error.code !== 'ENODATA' && error.code !== 'ENOTFOUND') throw error; });
      try { setServers(servers); } catch {}
      return;
    } catch { /* Try the next resolver without logging the connection string. */ }
  }
}
