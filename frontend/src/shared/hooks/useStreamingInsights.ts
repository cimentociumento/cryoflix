import { useEffect, useMemo, useState } from 'react';
import { httpClient } from '../api/httpClient';

export type StreamingMetrics = {
  totalEvents: number;
  byEvent: Record<string, number>;
  recent: Array<{ event: string; occurredAt: string }>;
};

const defaultMetrics: StreamingMetrics = {
  totalEvents: 1280,
  byEvent: { playback_started: 420, heartbeat: 700, purchase: 45, recommendation_click: 115 },
  recent: [],
};

export const useStreamingInsights = () => {
  const [metrics, setMetrics] = useState<StreamingMetrics>(defaultMetrics);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      setStatus('loading');
      try {
        const response = await httpClient<StreamingMetrics>('/analytics/metrics');
        if (mounted) {
          setMetrics(response);
          setStatus('ready');
        }
      } catch (error) {
        console.warn('Falling back to mocked analytics data', error);
        if (mounted) {
          setStatus('error');
        }
      }
    };

    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  const highlight = useMemo(() => {
    const entries = Object.entries(metrics.byEvent);
    if (!entries.length) {
      return null;
    }
    return entries.reduce(
      (acc, [event, value]) => (value > acc.value ? { event, value } : acc),
      { event: entries[0][0], value: entries[0][1] },
    );
  }, [metrics.byEvent]);

  return { metrics, status, highlight };
};

