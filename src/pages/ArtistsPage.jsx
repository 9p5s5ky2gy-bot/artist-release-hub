import { Edit3, Mail, Music2, Phone, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArtistForm } from '../components/ArtistForm';
import { ColorSwatches } from '../components/ColorSwatches';
import { EmptyState } from '../components/EmptyState';
import { ExternalLinkButton } from '../components/ExternalLinkButton';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export function ArtistsPage({ artists, releases, onSave, onDelete }) {
  const [editingArtist, setEditingArtist] = useState(null);
  const [showForm, setShowForm] = useState(!artists.length);
  const [formVersion, setFormVersion] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    if (!showForm || !formRef.current) return;
    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showForm, editingArtist?.id, formVersion]);

  function openNewArtist() {
    setEditingArtist(null);
    setFormVersion((version) => version + 1);
    setShowForm(true);
  }

  function handleSave(artist) {
    onSave(artist);
    setEditingArtist(null);
    setShowForm(false);
  }

  function requestDelete(artist) {
    const totalReleases = releases.filter((release) => release.artistId === artist.id).length;
    const message = totalReleases
      ? `Excluir ${artist.stageName} também remove ${totalReleases} lançamento(s) e suas orientações. Continuar?`
      : `Excluir ${artist.stageName}?`;
    if (window.confirm(message)) onDelete(artist.id);
  }

  return (
    <section className="page-content">
      <PageHeader eyebrow="Catálogo" title="Artistas">
        <button className="primary-button" onClick={openNewArtist} type="button">
          <Plus size={16} />
          <span>Novo artista</span>
        </button>
      </PageHeader>

      {showForm && (
        <div ref={formRef}>
          <ArtistForm
            key={editingArtist?.id || 'new-artist-' + formVersion}
            editingArtist={editingArtist}
            onSave={handleSave}
            onCancel={() => {
              setEditingArtist(null);
              setShowForm(false);
            }}
          />
        </div>
      )}

      <div className="entity-grid">
        {artists.map((artist) => {
          const releaseCount = releases.filter((release) => release.artistId === artist.id).length;
          return (
            <article className="artist-card" key={artist.id}>
              <div className="artist-card-top">
                <div className="artist-identity">
                  {artist.profileImage ? (
                    <img className="artist-avatar" src={artist.profileImage} alt={artist.stageName} loading="lazy" />
                  ) : (
                    <div className="artist-avatar artist-avatar-fallback"><Music2 size={18} /></div>
                  )}
                  <div>
                    <span className="eyebrow">{artist.genre || 'Sem estilo'}</span>
                    <h2>{artist.stageName}</h2>
                    <p>{artist.archetype || 'Estética ainda não definida'}</p>
                  </div>
                </div>
                <StatusBadge>{releaseCount} lanç.</StatusBadge>
              </div>

              <ColorSwatches colors={artist.visualColors} />

              <div className="meta-list">
                {artist.legalName && <span>Responsável: {artist.legalName}</span>}
                {artist.spotifyId && <span>Spotify ID: {artist.spotifyId}</span>}
                {artist.email && (
                  <span>
                    <Mail size={14} />
                    {artist.email}
                  </span>
                )}
                {artist.phone && (
                  <span>
                    <Phone size={14} />
                    {artist.phone}
                  </span>
                )}
              </div>

              {artist.notes && <p className="card-note">{artist.notes}</p>}

              <div className="link-row">
                <ExternalLinkButton href={artist.instagram}>Instagram</ExternalLinkButton>
                <ExternalLinkButton href={artist.tiktok}>TikTok</ExternalLinkButton>
                <ExternalLinkButton href={artist.youtube}>YouTube</ExternalLinkButton>
                <ExternalLinkButton href={artist.spotify}>Spotify</ExternalLinkButton>
              </div>

              <div className="card-actions">
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingArtist(artist);
                    setShowForm(true);
                  }}
                  type="button"
                >
                  <Edit3 size={15} />
                  <span>Editar</span>
                </button>
                <button className="danger-button" onClick={() => requestDelete(artist)} type="button">
                  <Trash2 size={15} />
                  <span>Excluir</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!artists.length && !showForm && (
        <EmptyState
          title="Nenhum artista cadastrado"
          action={<button className="secondary-button" onClick={openNewArtist} type="button">Cadastrar artista</button>}
        />
      )}
    </section>
  );
}
