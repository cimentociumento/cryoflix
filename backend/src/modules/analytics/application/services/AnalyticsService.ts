type AnalyticsEvent = {
  event: string;
  userId?: string;
  data: Record<string, unknown>;
  occurredAt: string;
};

export class AnalyticsService {
  private readonly events: AnalyticsEvent[] = [];

  recordEvent(event: string, payload: { userId?: string; data?: Record<string, unknown> }) {
    const entry: AnalyticsEvent = {
      event,
      userId: payload.userId,
      data: payload.data ?? {},
      occurredAt: new Date().toISOString(),
    };
    this.events.push(entry);
    return entry;
  }

  getMetrics() {
    return {
      totalEvents: this.events.length,
      byEvent: this.events.reduce<Record<string, number>>((acc, current) => {
        acc[current.event] = (acc[current.event] ?? 0) + 1;
        return acc;
      }, {}),
      recent: this.events.slice(-10),
    };
  }
}

