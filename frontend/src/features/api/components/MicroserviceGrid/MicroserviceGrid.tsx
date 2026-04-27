import { microservices } from '../../../../shared/constants/microservices';

export const MicroserviceGrid = () => (
  <section className="microservice-grid">
    {microservices.map((service) => (
      <article key={service.name}>
        <header>
          <h4>{service.name}</h4>
          <span className={`badge badge-${service.status}`}>{service.status}</span>
        </header>
        <p>{service.description}</p>
        <small>POD responsável: {service.owners.join(', ')}</small>
        <div className="stack">
          {service.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </article>
    ))}
  </section>
);

