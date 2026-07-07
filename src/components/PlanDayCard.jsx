import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatFullDate } from '../utils/date';
import { getDailyActionCount, getReleaseCover } from '../utils/release';
import { CoverImage } from './CoverImage';
import { StatusBadge } from './StatusBadge';

function phaseClassName(phase) {
  return String(phase || 'planejamento')
    .toLowerCase()
    .replaceAll('ç', 'c')
    .replaceAll('ã', 'a')
    .replaceAll('é', 'e')
    .replaceAll('ó', 'o')
    .replaceAll(' ', '-');
}

export function PlanDayCard({ day, onSetDayCompleted, onUpdateOrientation, onAddOrientation, onDeleteOrientation }) {
  const [newOrientation, setNewOrientation] = useState('');
  const cover = getReleaseCover(day.release);
  const isRandomPlan = day.release?.planMode === 'random' || day.orientations.some((item) => item.generatedPlan || item.templateId === 'random-plan');
  const maxActions = isRandomPlan ? getDailyActionCount(day.release) : Infinity;
  const canAddOrientation = day.orientations.length < maxActions;
  const heading = isRandomPlan ? 'Sugestões IA do dia' : 'Orientações do dia';

  function handleAdd(event) {
    event.preventDefault();
    if (!newOrientation.trim()) return;
    onAddOrientation(day, newOrientation);
    setNewOrientation('');
  }

  return (
    <article className={`plan-day-card phase-${phaseClassName(day.phase)} ${day.completed ? 'is-completed' : ''}`}>
      <div className="plan-day-topline">
        <div>
          <span className="eyebrow">Dia {day.dayNumber}</span>
          <h2>{formatFullDate(day.date)}</h2>
          <p>{day.relation}</p>
        </div>
        <StatusBadge tone={day.completed ? 'mint' : 'neutral'}>{day.completed ? 'Concluído' : 'Não concluído'}</StatusBadge>
      </div>

      {cover && (
        <div className="plan-day-release-strip">
          <CoverImage src={cover} alt={day.release?.songTitle || 'Capa do lançamento'} />
          <div>
            <strong>{day.release?.songTitle || 'Lançamento'}</strong>
            <span>{day.artist?.stageName || 'Artista'} · {day.phase}</span>
          </div>
        </div>
      )}

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
          Dia concluído/postado
        </span>
      </label>

      <section className="orientation-section">
        <div className="orientation-heading">
          <strong>{heading}</strong>
          <span>{isRandomPlan ? `${day.orientations.length}/${maxActions} ação(ões)` : `${day.orientations.length} item(s)`}</span>
        </div>

        <div className="orientation-list">
          {day.orientations.map((orientation, index) => (
            <div className="orientation-card" key={orientation.id}>
              <div className="orientation-card-head">
                <StatusBadge tone={orientation.priority === 'alta' ? 'red' : orientation.priority === 'média' ? 'yellow' : 'blue'}>
                  {orientation.type || `Ação ${index + 1}`}
                </StatusBadge>
                <button
                  className="icon-button orientation-remove"
                  type="button"
                  onClick={() => onDeleteOrientation(orientation.id)}
                  aria-label="Remover orientação"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <textarea
                className="orientation-title-input"
                value={orientation.title}
                onChange={(event) => onUpdateOrientation(orientation.id, { title: event.target.value })}
                rows="2"
                aria-label="Título da ação"
              />
              <textarea
                className="orientation-description-input"
                value={orientation.description || ''}
                onChange={(event) => onUpdateOrientation(orientation.id, { description: event.target.value })}
                rows="4"
                placeholder="Sugestão do que postar, gancho, CTA ou observação"
                aria-label="Sugestão detalhada da ação"
              />
            </div>
          ))}
        </div>

        {canAddOrientation ? (
          <form className="add-orientation-form" onSubmit={handleAdd}>
            <input
              value={newOrientation}
              onChange={(event) => setNewOrientation(event.target.value)}
              placeholder="Adicionar ação para este dia"
            />
            <button className="secondary-button compact" type="submit">
              <Plus size={15} />
              <span>Adicionar</span>
            </button>
          </form>
        ) : (
          <p className="orientation-limit-note">Este lançamento está configurado para {maxActions} ação(ões) por dia. Edite as sugestões acima ou regenere com outra quantidade.</p>
        )}
      </section>
    </article>
  );
}
