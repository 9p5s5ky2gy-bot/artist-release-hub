import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatFullDate } from '../utils/date';
import { StatusBadge } from './StatusBadge';

export function PlanDayCard({ day, onSetDayCompleted, onUpdateOrientation, onAddOrientation, onDeleteOrientation }) {
  const [newOrientation, setNewOrientation] = useState('');

  function handleAdd(event) {
    event.preventDefault();
    if (!newOrientation.trim()) return;
    onAddOrientation(day, newOrientation);
    setNewOrientation('');
  }

  return (
    <article className={`plan-day-card phase-${day.phase.toLowerCase().replaceAll('ç', 'c').replaceAll('ã', 'a').replaceAll('é', 'e').replaceAll('ó', 'o').replaceAll(' ', '-')} ${day.completed ? 'is-completed' : ''}`}>
      <div className="plan-day-topline">
        <div>
          <span className="eyebrow">Dia {day.dayNumber}</span>
          <h2>{formatFullDate(day.date)}</h2>
          <p>{day.relation}</p>
        </div>
        <StatusBadge tone={day.completed ? 'mint' : 'neutral'}>{day.completed ? 'Concluído' : 'Não concluído'}</StatusBadge>
      </div>

      <div className="plan-day-meta">
        <span>Fase: <strong>{day.phase}</strong></span>
        <span>{day.artist?.stageName || 'Artista'} · {day.release?.songTitle || 'Lançamento'}</span>
      </div>

      <label className="day-complete-control">
        <input
          type="checkbox"
          checked={day.completed}
          onChange={(event) => onSetDayCompleted(day.releaseId, day.date, event.target.checked)}
        />
        <span>
          <CheckCircle2 size={17} />
          Dia concluído
        </span>
      </label>

      <section className="orientation-section">
        <div className="orientation-heading">
          <strong>Orientações do dia</strong>
          <span>{day.orientations.length} item(s)</span>
        </div>

        <div className="orientation-list">
          {day.orientations.map((orientation) => (
            <div className="orientation-item" key={orientation.id}>
              <textarea
                value={orientation.title}
                onChange={(event) => onUpdateOrientation(orientation.id, { title: event.target.value })}
                rows="2"
                aria-label="Texto da orientação"
              />
              <button
                className="icon-button orientation-remove"
                type="button"
                onClick={() => onDeleteOrientation(orientation.id)}
                aria-label="Remover orientação"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <form className="add-orientation-form" onSubmit={handleAdd}>
          <input
            value={newOrientation}
            onChange={(event) => setNewOrientation(event.target.value)}
            placeholder="Adicionar orientação para este dia"
          />
          <button className="secondary-button compact" type="submit">
            <Plus size={15} />
            <span>Adicionar</span>
          </button>
        </form>
      </section>
    </article>
  );
}
