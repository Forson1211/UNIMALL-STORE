import { Resolver, getServers } from 'node:dns/promises';
import { configuration } from './config.mjs';

try {
  const uri = new URL(configuration().uri);
  console.log(JSON.stringify({ atlasHostname: uri.hostname.endsWith('.mongodb.net'), usernamePresent: !!uri.username, passwordPresent: !!uri.password, srvConnection: uri.protocol === 'mongodb+srv:' }));
  if (uri.protocol === 'mongodb+srv:') {
    for (const [label, addresses] of [['system', getServers()], ['cloudflare', ['1.1.1.1']], ['google', ['8.8.8.8']]]) {
      const resolver = new Resolver({ timeout: 3000, tries: 1 });
      resolver.setServers(addresses);
      try {
        const records = await resolver.resolveSrv('_mongodb._tcp.' + uri.hostname);
        const txt = await resolver.resolveTxt(uri.hostname);
        console.log(JSON.stringify({ resolver: label, srvRecords: records.length, txtRecords: txt.length, resolved: true }));
      } catch (error) { console.log(JSON.stringify({ resolver: label, resolved: false, code: error.code })); }
    }
  }
} catch { console.error('The MongoDB URI could not be parsed. No credentials were printed.'); process.exitCode = 1; }
