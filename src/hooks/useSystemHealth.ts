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

const ACTIVE_SESSION_WINDOW_MINUTES = 15;
const ACTIVE_SESSION_WINDOW_MS = ACTIVE_SESSION_WINDOW_MINUTES * 60 * 1000;
const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

const initialSnapshot: SystemHealthSnapshot = {
  database: { status: "unknown", latencyMs: null, error: null },
  api: { status: "unknown", averageResponseTimeMs: null, sampleCount: 0, error: null },
  activeSessions: { status: "unknown", count: null, windowMinutes: ACTIVE_SESSION_WINDOW_MINUTES, error: null },
  checkedAt: null,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to read health metric";
}

function getLatencyStatus(latencyMs: number): HealthStatus {
  if (latencyMs > 1_000) return "degraded";
  return "healthy";
}

export function useSystemHealth(refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS) {
  const [health, setHealth] = useState<SystemHealthSnapshot>(initialSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);

    const measuredRequests: number[] = [];
    const databaseStartedAt = performance.now();
    const databaseResult = await supabase
      .from("site_settings")
      .select("setting_key")
      .limit(1);
    const databaseLatencyMs = Math.max(0, Math.round(performance.now() - databaseStartedAt));
    measuredRequests.push(databaseLatencyMs);

    const activeSessionStartedAt = performance.now();
    const activeSessionResult = await supabase
      .from("active_sessions")
      .select("session_id", { count: "exact", head: true })
      .gte("last_seen_at", new Date(Date.now() - ACTIVE_SESSION_WINDOW_MS).toISOString());
    const activeSessionLatencyMs = Math.max(0, Math.round(performance.now() - activeSessionStartedAt));
    measuredRequests.push(activeSessionLatencyMs);

    const databaseError = databaseResult.error;
    const activeSessionError = activeSessionResult.error;
    const databaseStatus: HealthStatus = databaseError
      ? "offline"
      : getLatencyStatus(databaseLatencyMs);
    const apiStatus: HealthStatus = databaseError
      ? "offline"
      : getLatencyStatus(Math.round(measuredRequests.reduce((total, value) => total + value, 0) / measuredRequests.length));
    const activeSessionsStatus: HealthStatus = activeSessionError
      ? "degraded"
      : "healthy";

    setHealth({
      database: {
        status: databaseStatus,
        latencyMs: databaseError ? null : databaseLatencyMs,
        error: databaseError ? getErrorMessage(databaseError) : null,
      },
      api: {
        status: apiStatus,
        averageResponseTimeMs: databaseError ? null : Math.round(measuredRequests.reduce((total, value) => total + value, 0) / measuredRequests.length),
        sampleCount: databaseError ? 0 : measuredRequests.length,
        error: databaseError ? getErrorMessage(databaseError) : activeSessionError ? getErrorMessage(activeSessionError) : null,
      },
      activeSessions: {
        status: activeSessionsStatus,
        count: activeSessionError ? null : activeSessionResult.count ?? 0,
        windowMinutes: ACTIVE_SESSION_WINDOW_MINUTES,
        error: activeSessionError ? getErrorMessage(activeSessionError) : null,
      },
      checkedAt: new Date().toISOString(),
    });

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
