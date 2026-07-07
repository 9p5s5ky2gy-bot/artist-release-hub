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

function getTextareaRows(text, minRows = 3, charsPerLine = 44, maxRows = 18) {
  const value = String(text || '');
  const visualRows = value.split('\n').reduce((total, line) => {
    return total + Math.max(1, Math.ceil(line.length / charsPerLine));
  }, 0);

  return Math.min(maxRows, Math.max(minRows, visualRows));
}

function getSuggestionLines(description) {
  return String(description || '')
    .replace(/\s+(Formato:|Gancho:|Momento:|CTA:)/g, '\n$1')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
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
          {day.orientations.map((orientation, index) => {
            const suggestionLines = getSuggestionLines(orientation.description);

            return (
              <div className="orientation-card" key={orientation.id}>
                <div className="orientation-card-head">
                  <div className="orientation-card-labels">
                    <span className="orientation-action-number">Ação {index + 1}</span>
                    <StatusBadge tone={orientation.priority === 'alta' ? 'red' : orientation.priority === 'média' ? 'yellow' : 'blue'}>
                      {orientation.type || `Ação ${index + 1}`}
                    </StatusBadge>
                  </div>
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
                  rows={getTextareaRows(orientation.title, 2, 32, 5)}
                  aria-label="Título da ação"
                />

                <div className="orientation-suggestion-render" aria-label="Sugestão IA renderizada">
                  <span className="orientation-suggestion-kicker">Sugestão IA pronta para postar</span>
                  {suggestionLines.length ? (
                    suggestionLines.map((line, lineIndex) => <p key={orientation.id + '-' + lineIndex}>{line}</p>)
                  ) : (
                    <p>Adicione aqui o gancho, formato e chamada principal desta ação.</p>
                  )}
                </div>

                <details className="orientation-edit-panel">
                  <summary>Editar texto da sugestão</summary>
                  <textarea
                    className="orientation-description-input"
                    value={orientation.description || ''}
                    onChange={(event) => onUpdateOrientation(orientation.id, { description: event.target.value })}
                    rows={getTextareaRows(orientation.description, 4, 44, 18)}
                    placeholder="Sugestão do que postar, gancho, CTA ou observação"
                    aria-label="Sugestão detalhada da ação"
                  />
                </details>
              </div>
            );
          })}
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
