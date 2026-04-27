import { sprintRoadmap } from '../../../../shared/constants/microservices';

const statusLabels: Record<string, string> = {
  concluido: 'concluído',
  'em-andamento': 'em andamento',
  proximo: 'próximo',
  planejado: 'planejado',
};

export const SprintTimeline = () => (
  <ul className="sprint-timeline">
    {sprintRoadmap.map((sprint) => (
      <li key={sprint.sprint}>
        <div>
          <p className="sprint-label">{sprint.sprint}</p>
          <strong>{sprint.focus}</strong>
        </div>
        <div className="sprint-details">
          <span>{sprint.outcomes.join(' • ')}</span>
          <small className={`badge badge-${sprint.status}`}>
            {statusLabels[sprint.status] ?? sprint.status}
          </small>
        </div>
      </li>
    ))}
  </ul>
);

