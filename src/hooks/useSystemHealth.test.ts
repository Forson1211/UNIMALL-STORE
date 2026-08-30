import { describe, expect, it } from "vitest";
import { buildHealthSnapshot } from "./useSystemHealth";

describe("buildHealthSnapshot", () => {
  it("reports healthy metrics and averages successful probe latencies", () => {
    const snapshot = buildHealthSnapshot(
      {
        databaseLatencyMs: 120,
        databaseError: null,
        activeSessionsLatencyMs: 180,
        activeSessionsCount: 7,
        activeSessionsError: null,
      },
      "2026-08-28T00:00:00.000Z",
    );

    expect(snapshot.database).toMatchObject({ status: "healthy", latencyMs: 120, error: null });
    expect(snapshot.api).toMatchObject({ status: "healthy", averageResponseTimeMs: 150, sampleCount: 2, error: null });
    expect(snapshot.activeSessions).toMatchObject({ status: "healthy", count: 7, windowMinutes: 15, error: null });
    expect(snapshot.checkedAt).toBe("2026-08-28T00:00:00.000Z");
  });

  it("keeps the API latency sample when active-session telemetry is unavailable", () => {
    const snapshot = buildHealthSnapshot({
      databaseLatencyMs: 220,
      databaseError: null,
      activeSessionsLatencyMs: 90,
      activeSessionsCount: null,
      activeSessionsError: new Error("active_sessions table is unavailable"),
    });

    expect(snapshot.database.status).toBe("healthy");
    expect(snapshot.api).toMatchObject({
      status: "degraded",
      averageResponseTimeMs: 220,
      sampleCount: 1,
      error: "active_sessions table is unavailable",
    });
    expect(snapshot.activeSessions).toMatchObject({ status: "degraded", count: null });
  });

  it("reports the system offline when all probes fail", () => {
    const snapshot = buildHealthSnapshot({
      databaseLatencyMs: 0,
      databaseError: new Error("database timeout"),
      activeSessionsLatencyMs: 0,
      activeSessionsCount: null,
      activeSessionsError: new Error("session timeout"),
    });

    expect(snapshot.database).toMatchObject({ status: "offline", latencyMs: null, error: "database timeout" });
    expect(snapshot.api).toMatchObject({ status: "offline", averageResponseTimeMs: null, sampleCount: 0 });
    expect(snapshot.api.error).toContain("database timeout");
    expect(snapshot.api.error).toContain("session timeout");
    expect(snapshot.activeSessions).toMatchObject({ status: "degraded", count: null, error: "session timeout" });
  });
});
