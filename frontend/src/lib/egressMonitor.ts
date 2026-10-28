/**
 * Development-Only Egress & Network Telemetry Monitor
 * Tracks database query frequency, storage operations, and realtime connections in dev mode.
 */

interface EgressStats {
  dbQueriesCount: number;
  storageUploadsCount: number;
  realtimeEventsCount: number;
  lastQueryTimestamp: number;
  queryLog: Array<{ tableOrRpc: string; timestamp: string }>;
}

const stats: EgressStats = {
  dbQueriesCount: 0,
  storageUploadsCount: 0,
  realtimeEventsCount: 0,
  lastQueryTimestamp: 0,
  queryLog: [],
};

export const egressMonitor = {
  recordDbQuery(tableOrRpc: string) {
    if (!import.meta.env.DEV) return;
    stats.dbQueriesCount++;
    stats.lastQueryTimestamp = Date.now();
    stats.queryLog.push({
      tableOrRpc,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (stats.queryLog.length > 50) stats.queryLog.shift();

    // Check for rapid query spikes (e.g. > 10 queries in 5 seconds)
    const recentQueries = stats.queryLog.filter(
      (q) => Date.now() - new Date(`1970-01-01T${q.timestamp}`).getTime() < 5000
    );
    if (recentQueries.length > 10) {
      console.warn(`[EgressMonitor] High query frequency detected: ${recentQueries.length} queries in 5s!`, recentQueries);
    }
  },

  recordStorageUpload(bucket: string, sizeBytes: number) {
    if (!import.meta.env.DEV) return;
    stats.storageUploadsCount++;
    const kb = (sizeBytes / 1024).toFixed(1);
    console.info(`[EgressMonitor] Storage Upload to '${bucket}': ${kb} KB (Optimized WebP)`);
  },

  recordRealtimeEvent(channelName: string, eventType: string) {
    if (!import.meta.env.DEV) return;
    stats.realtimeEventsCount++;
    console.info(`[EgressMonitor] Realtime Event on '${channelName}': ${eventType}`);
  },

  getStats() {
    return { ...stats };
  },

  reset() {
    stats.dbQueriesCount = 0;
    stats.storageUploadsCount = 0;
    stats.realtimeEventsCount = 0;
    stats.queryLog = [];
  },
};

// Expose on window for easy developer inspection in browser console
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).__UNIMALL_EGRESS_MONITOR__ = egressMonitor;
}
