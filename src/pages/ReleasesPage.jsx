import { CalendarDays, Edit3, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { ExternalLinkButton } from '../components/ExternalLinkButton';
import { PageHeader } from '../components/PageHeader';
import { ReleaseForm } from '../components/ReleaseForm';
import { StatusBadge } from '../components/StatusBadge';
import { formatFullDate, formatHumanDate } from '../utils/date';
import { getReleaseProgress } from '../utils/calendar';

export function ReleasesPage({ artists, releases, planDays, onSave, onDelete, onRegenerate, onNavigate }) {
  const [editingRelease, setEditingRelease] = useState(null);
  const [showForm, setShowForm] = useState(!releases.length);

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
        <button className="primary-button" onClick={() => setShowForm(true)} type="button">
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
        <ReleaseForm
          artists={artists}
          editingRelease={editingRelease}
          onSave={handleSave}
          onCancel={() => {
            setEditingRelease(null);
            setShowForm(false);
          }}
        />
      )}

      <div className="release-grid">
        {releases.map((release) => {
          const artist = artists.find((item) => item.id === release.artistId);
          const progress = getReleaseProgress(release.id, planDays);

          return (
            <article className="release-card" key={release.id}>
              <div className="release-card-media">
                <CoverImage src={release.coverUrl} alt={release.songTitle} />
                <StatusBadge>{release.status}</StatusBadge>
              </div>

              <div className="release-card-body">
                <span className="eyebrow">{artist?.stageName || 'Artista removido'}</span>
                <h2>{release.songTitle}</h2>
                <div className="date-pair">
                  <span>
                    <CalendarDays size={15} />
                    Lançamento: {formatFullDate(release.releaseDate)}
                  </span>
                  <span>Pré-save: {formatHumanDate(release.presaveDate)}</span>
                </div>
                {release.notes && <p className="card-note">{release.notes}</p>}

                <div className="progress-block">
                  <div>
                    <span>{progress.completedDays}/{progress.totalDays} dias concluídos</span>
                    <strong>{progress.percent}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${progress.percent}%` }} />
                  </div>
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
                  <button className="secondary-button" onClick={() => onRegenerate(release.id)} type="button">
                    <RefreshCcw size={15} />
                    <span>Regerar</span>
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
          action={<button className="secondary-button" onClick={() => setShowForm(true)} type="button">Cadastrar lançamento</button>}
        />
      )}
    </section>
  );
}
