import { useStreamingInsights } from '../../../../shared/hooks/useStreamingInsights';

export const StreamingInsights = () => {
  const { metrics, status, highlight } = useStreamingInsights();

  return (
    <section className="streaming-insights">
      <header>
        <p>Status {status === 'ready' ? 'em tempo real' : 'mockado'}</p>
        <strong>{metrics.totalEvents.toLocaleString()} eventos monitorados</strong>
      </header>
      <div className="insight-grid">
        {Object.entries(metrics.byEvent).map(([event, value]) => (
          <article key={event}>
            <span>{event}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      {highlight ? (
        <footer>
          Pico: <strong>{highlight.event}</strong> ({highlight.value} eventos)
        </footer>
      ) : null}
    </section>
  );
};

