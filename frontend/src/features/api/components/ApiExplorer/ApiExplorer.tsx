import { useMemo, useState } from 'react';
import { apiEndpoints } from '../../../../shared/constants/microservices';

const filters = ['Todos', 'Auth', 'Content', 'Streaming', 'Payment', 'Recommendation'];

export const ApiExplorer = () => {
  const [filter, setFilter] = useState<string>('Todos');

  const filtered = useMemo(
    () =>
      filter === 'Todos'
        ? apiEndpoints
        : apiEndpoints.filter((endpoint) => endpoint.service === filter),
    [filter],
  );

  return (
    <section className="api-explorer">
      <header>
        <h3>APIs REST do núcleo</h3>
        <div className="filters">
          {filters.map((item) => (
            <button
              key={item}
              className={item === filter ? 'active' : ''}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </header>
      <table>
        <thead>
          <tr>
            <th>Método</th>
            <th>Path</th>
            <th>Serviço</th>
            <th>Descrição</th>
            <th>Criticidade</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((endpoint) => (
            <tr key={`${endpoint.method}-${endpoint.path}`}>
              <td>{endpoint.method}</td>
              <td>{endpoint.path}</td>
              <td>{endpoint.service}</td>
              <td>{endpoint.summary}</td>
              <td>
                <span className={`badge badge-${endpoint.criticality}`}>{endpoint.criticality}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

