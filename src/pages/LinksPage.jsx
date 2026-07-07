import { Copy, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatHumanDate } from '../utils/date';
import { getReleaseCover } from '../utils/release';

function getReleaseLinks(release) {
  return [
    { label: 'Pré-save', url: release.presaveLink },
    { label: 'Spotify', url: release.spotifyLink },
    { label: 'YouTube', url: release.youtubeLink },
    { label: 'TikTok', url: release.tiktokLink },
    { label: 'Instagram', url: release.instagramLink },
    { label: 'Drive', url: release.driveLink },
    { label: 'Canva', url: release.canvaLink },
    ...(release.customLinks || []),
  ].filter((link) => link.url);
}

export function LinksPage({ artists, releases }) {
  const [artistId, setArtistId] = useState('');
  const [releaseId, setReleaseId] = useState('');

  const filteredReleases = useMemo(
    () =>
      releases.filter((release) => {
        const matchesArtist = !artistId || release.artistId === artistId;
        const matchesRelease = !releaseId || release.id === releaseId;
        return matchesArtist && matchesRelease;
      }),
    [releases, artistId, releaseId],
  );

  function copyLink(url) {
    navigator.clipboard?.writeText(url);
  }

  const visibleReleaseOptions = artistId
    ? releases.filter((release) => release.artistId === artistId)
    : releases;

  return (
    <section className="page-content">
      <PageHeader eyebrow="Central de URLs" title="Links" />

      <div className="filters-bar">
        <label>
          Artista
          <select
            value={artistId}
            onChange={(event) => {
              setArtistId(event.target.value);
              setReleaseId('');
            }}
          >
            <option value="">Todos</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.stageName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lançamento
          <select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>
            <option value="">Todos</option>
            {visibleReleaseOptions.map((release) => (
              <option key={release.id} value={release.id}>
                {release.songTitle}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="links-grid">
        {filteredReleases.map((release) => {
          const artist = artists.find((item) => item.id === release.artistId);
          const links = getReleaseLinks(release);

          return (
            <article className="links-card" key={release.id}>
              <div className="links-card-head">
                <CoverImage src={getReleaseCover(release)} alt={release.songTitle} />
                <div>
                  <span className="eyebrow">{artist?.stageName || 'Artista removido'}</span>
                  <h2>{release.songTitle}</h2>
                  <span>{formatHumanDate(release.releaseDate)}</span>
                </div>
                <StatusBadge>{release.status}</StatusBadge>
              </div>

              {links.length ? (
                <div className="links-list">
                  {links.map((link) => (
                    <div className="saved-link" key={`${release.id}-${link.label}-${link.url}`}>
                      <div>
                        <strong>{link.label}</strong>
                        <span>{link.url}</span>
                      </div>
                      <button className="icon-button" onClick={() => copyLink(link.url)} aria-label="Copiar link">
                        <Copy size={16} />
                      </button>
                      <a className="icon-button" href={link.url} target="_blank" rel="noreferrer" aria-label="Abrir link">
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sem links cadastrados" />
              )}
            </article>
          );
        })}
      </div>

      {!filteredReleases.length && <EmptyState title="Nenhum lançamento encontrado" />}
    </section>
  );
}
