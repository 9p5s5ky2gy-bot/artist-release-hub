import { CalendarDays, Edit3, Eraser, Plus, RefreshCcw, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { ExternalLinkButton } from '../components/ExternalLinkButton';
import { PageHeader } from '../components/PageHeader';
import { ReleaseForm } from '../components/ReleaseForm';
import { StatusBadge } from '../components/StatusBadge';
import { formatFullDate, formatHumanDate } from '../utils/date';
import { getReleaseProgress } from '../utils/calendar';
import { getDailyActionCount, getReleaseCover, getReleaseType } from '../utils/release';

export function ReleasesPage({
  artists,
  releases,
  planDays,
  onSave,
  onDelete,
  onRegenerate,
  onGenerateRandomPlan,
  onClearGeneratedPlan,
  onNavigate,
}) {
  const [editingRelease, setEditingRelease] = useState(null);
  const [showForm, setShowForm] = useState(!releases.length);
  const [formVersion, setFormVersion] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    if (!showForm || !formRef.current) return;
    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showForm, editingRelease?.id, formVersion]);

  function openNewRelease() {
    setEditingRelease(null);
    setFormVersion((version) => version + 1);
    setShowForm(true);
  }

  function handleSave(release) {
    onSave(release);
    setEditingRelease(null);
    setShowForm(false);
  }

  function requestDelete(release) {
    if (window.confirm(`Excluir o lançamento "${release.songTitle}" e suas orientações?`)) {
      onDelete(release.id);
    }
  }

  return (
    <section className="page-content">
      <PageHeader eyebrow="Campanhas" title="Lançamentos">
        <button className="primary-button" onClick={openNewRelease} type="button">
          <Plus size={16} />
          <span>Novo lançamento</span>
        </button>
      </PageHeader>

      {!artists.length && (
        <EmptyState
          title="Cadastre um artista primeiro"
          text="Cada música precisa estar vinculada a um artista."
          action={<button className="secondary-button" onClick={() => onNavigate('artists')} type="button">Ir para artistas</button>}
        />
      )}

      {showForm && artists.length > 0 && (
        <div ref={formRef}>
          <ReleaseForm
            key={editingRelease?.id || 'new-release-' + formVersion}
            artists={artists}
            editingRelease={editingRelease}
            onSave={handleSave}
            onCancel={() => {
              setEditingRelease(null);
              setShowForm(false);
            }}
          />
        </div>
      )}

      <div className="release-grid">
        {releases.map((release) => {
          const artist = artists.find((item) => item.id === release.artistId);
          const progress = getReleaseProgress(release.id, planDays);
          const remainingDays = Math.max(progress.totalDays - progress.completedDays, 0);
          const hasRandomPlan = release.planMode === 'random' || release.randomPlanGeneratedAt;

          return (
            <article className="release-card" key={release.id}>
              <div className="release-card-media">
                <CoverImage src={getReleaseCover(release)} alt={release.songTitle} />
                <StatusBadge>{release.status}</StatusBadge>
              </div>

              <div className="release-card-body">
                <div className="release-card-title-row">
                  <div>
                    <span className="eyebrow">{artist?.stageName || 'Artista removido'}</span>
                    <h2>{release.songTitle}</h2>
                  </div>
                  <StatusBadge tone={hasRandomPlan ? 'mint' : 'neutral'}>{hasRandomPlan ? `${getDailyActionCount(release)} ações/dia` : getReleaseType(release)}</StatusBadge>
                </div>

                <div className="date-pair">
                  <span>
                    <CalendarDays size={15} />
                    Lançamento: {formatFullDate(release.releaseDate)}
                  </span>
                  <span>Pré-save: {formatHumanDate(release.presaveDate)}</span>
                  <span>Tipo: {getReleaseType(release)}</span>
                </div>
                {release.notes && <p className="card-note">{release.notes}</p>}

                <div className="progress-block">
                  <div>
                    <span>{progress.completedDays}/{progress.totalDays} dias concluídos · {remainingDays} faltam</span>
                    <strong>{progress.percent}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>

                <div className="release-progress-pills">
                  <StatusBadge tone="mint">{progress.completedDays} feitos</StatusBadge>
                  <StatusBadge tone="blue">{remainingDays} em aberto</StatusBadge>
                  <StatusBadge tone="yellow">{progress.percent}% concluído</StatusBadge>
                  <StatusBadge tone="neutral">{getDailyActionCount(release)} ação(ões)/dia</StatusBadge>
                </div>

                <div className="link-row">
                  <ExternalLinkButton href={release.presaveLink}>Pré-save</ExternalLinkButton>
                  <ExternalLinkButton href={release.spotifyLink}>Spotify</ExternalLinkButton>
                  <ExternalLinkButton href={release.youtubeLink}>YouTube</ExternalLinkButton>
                  <ExternalLinkButton href={release.driveLink}>Drive</ExternalLinkButton>
                </div>

                <div className="card-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingRelease(release);
                      setShowForm(true);
                    }}
                    type="button"
                  >
                    <Edit3 size={15} />
                    <span>Editar</span>
                  </button>
                  {onNavigate && (
                    <button className="secondary-button" onClick={() => onNavigate('reports')} type="button">
                      <CalendarDays size={15} />
                      <span>Gerar relatorio</span>
                    </button>
                  )}
                  <button className="secondary-button" onClick={() => onGenerateRandomPlan(release.id)} type="button">
                    <Sparkles size={15} />
                    <span>{hasRandomPlan ? 'Regenerar IA' : 'Gerar sugestões IA'}</span>
                  </button>
                  {hasRandomPlan && (
                    <button className="secondary-button" onClick={() => onClearGeneratedPlan(release.id)} type="button">
                      <Eraser size={15} />
                      <span>Limpar IA</span>
                    </button>
                  )}
                  <button className="secondary-button" onClick={() => onRegenerate(release.id)} type="button">
                    <RefreshCcw size={15} />
                    <span>Modelo padrão</span>
                  </button>
                  <button className="danger-button" onClick={() => requestDelete(release)} type="button">
                    <Trash2 size={15} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!releases.length && !showForm && artists.length > 0 && (
        <EmptyState
          title="Nenhum lançamento cadastrado"
          action={<button className="secondary-button" onClick={openNewRelease} type="button">Cadastrar lançamento</button>}
        />
      )}
    </section>
  );
}
