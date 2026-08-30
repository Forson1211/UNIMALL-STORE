import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HealthStatus = "healthy" | "degraded" | "offline" | "unknown";

export interface SystemHealthSnapshot {
  database: {
    status: HealthStatus;
    latencyMs: number | null;
    error: string | null;
  };
  api: {
    status: HealthStatus;
    averageResponseTimeMs: number | null;
    sampleCount: number;
    error: string | null;
  };
  activeSessions: {
    status: HealthStatus;
    count: number | null;
    windowMinutes: number;
    error: string | null;
  };
  checkedAt: string | null;
}

export interface HealthProbeSnapshot {
  databaseLatencyMs: number | null;
  databaseError: unknown | null;
  activeSessionsLatencyMs: number | null;
  activeSessionsCount: number | null;
  activeSessionsError: unknown | null;
}

export const ACTIVE_SESSION_WINDOW_MINUTES = 15;
const ACTIVE_SESSION_WINDOW_MS = ACTIVE_SESSION_WINDOW_MINUTES * 60 * 1000;
const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

const initialSnapshot: SystemHealthSnapshot = {
  database: { status: "unknown", latencyMs: null, error: null },
  api: { status: "unknown", averageResponseTimeMs: null, sampleCount: 0, error: null },
  activeSessions: { status: "unknown", count: null, windowMinutes: ACTIVE_SESSION_WINDOW_MINUTES, error: null },
  checkedAt: null,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unable to read health metric";
}

function getLatencyStatus(latencyMs: number): HealthStatus {
  if (latencyMs > 1_000) return "degraded";
  return "healthy";
}

export function buildHealthSnapshot(
  probe: HealthProbeSnapshot,
  checkedAt = new Date().toISOString(),
): SystemHealthSnapshot {
  const databaseHasResult = !probe.databaseError && probe.databaseLatencyMs !== null;
  const activeSessionsHasResult = !probe.activeSessionsError && probe.activeSessionsLatencyMs !== null;
  const successfulLatencies = [
    databaseHasResult ? probe.databaseLatencyMs : null,
    activeSessionsHasResult ? probe.activeSessionsLatencyMs : null,
  ].filter((latency): latency is number => latency !== null);
  const averageResponseTimeMs = successfulLatencies.length > 0
    ? Math.round(successfulLatencies.reduce((total, latency) => total + latency, 0) / successfulLatencies.length)
    : null;
  const hasProbeError = Boolean(probe.databaseError || probe.activeSessionsError);
  const apiStatus: HealthStatus = successfulLatencies.length === 0
    ? "offline"
    : hasProbeError
      ? "degraded"
      : getLatencyStatus(averageResponseTimeMs ?? 0);
  const errors = [probe.databaseError, probe.activeSessionsError]
    .filter(Boolean)
    .map(getErrorMessage);

  return {
    database: {
      status: probe.databaseError
        ? "offline"
        : probe.databaseLatencyMs === null
          ? "unknown"
          : getLatencyStatus(probe.databaseLatencyMs),
      latencyMs: databaseHasResult ? probe.databaseLatencyMs : null,
      error: probe.databaseError ? getErrorMessage(probe.databaseError) : null,
    },
    api: {
      status: apiStatus,
      averageResponseTimeMs,
      sampleCount: successfulLatencies.length,
      error: errors.length > 0 ? errors.join("; ") : null,
    },
    activeSessions: {
      status: probe.activeSessionsError
        ? "degraded"
        : probe.activeSessionsLatencyMs === null
          ? "unknown"
          : "healthy",
      count: activeSessionsHasResult ? probe.activeSessionsCount ?? 0 : null,
      windowMinutes: ACTIVE_SESSION_WINDOW_MINUTES,
      error: probe.activeSessionsError ? getErrorMessage(probe.activeSessionsError) : null,
    },
    checkedAt,
  };
}

interface TimedResult<T> {
  value: T | null;
  latencyMs: number;
  error: unknown | null;
}

async function measure<T>(operation: () => Promise<T>): Promise<TimedResult<T>> {
  const startedAt = performance.now();
  try {
    return {
      value: await operation(),
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      error: null,
    };
  } catch (error) {
    return {
      value: null,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      error,
    };
  }
}

export function useSystemHealth(refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS) {
  const [health, setHealth] = useState<SystemHealthSnapshot>(initialSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);

    const [databaseProbe, activeSessionsProbe] = await Promise.all([
      measure(() => supabase.from("site_settings").select("setting_key").limit(1)),
      measure(() => supabase
        .from("active_sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("last_seen_at", new Date(Date.now() - ACTIVE_SESSION_WINDOW_MS).toISOString())),
    ]);

    const activeSessionsData = activeSessionsProbe.value as { count: number | null } | null;
    setHealth(buildHealthSnapshot({
      databaseLatencyMs: databaseProbe.latencyMs,
      databaseError: databaseProbe.error || (databaseProbe.value as { error?: unknown } | null)?.error || null,
      activeSessionsLatencyMs: activeSessionsProbe.latencyMs,
      activeSessionsCount: activeSessionsData?.count ?? null,
      activeSessionsError: activeSessionsProbe.error || (activeSessionsProbe.value as { error?: unknown } | null)?.error || null,
    }));

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), refreshIntervalMs);
    return () => window.clearInterval(interval);
  }, [checkHealth, refreshIntervalMs]);

  return { health, isLoading, isRefreshing, refetch: checkHealth };
}
