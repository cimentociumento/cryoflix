import { catalogHighlights } from '../../../../shared/constants/microservices';

export const ContentShowcase = () => (
  <section className="content-showcase">
    {catalogHighlights.map((item) => (
      <article key={item.title} className="content-card">
        <span>{item.category}</span>
        <h4>{item.title}</h4>
        <p>{item.duration}</p>
        <small>{item.quality}</small>
      </article>
    ))}
  </section>
);

