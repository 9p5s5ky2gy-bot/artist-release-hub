import {
  Edit3,
  Eye,
  Flag,
  Gem,
  Mail,
  Music2,
  Palette,
  Phone,
  Plus,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Waves,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArtistForm } from '../components/ArtistForm';
import { ColorSwatches } from '../components/ColorSwatches';
import { EmptyState } from '../components/EmptyState';
import { ExternalLinkButton } from '../components/ExternalLinkButton';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { getArtistIdentity, splitIdentityTags } from '../utils/artistIdentity';

const IDENTITY_SECTIONS = [
  { key: 'flag', title: 'Bandeira artística', icon: Flag },
  { key: 'archetypes', title: 'Arquétipos', icon: Sparkles },
  { key: 'accessories', title: 'Acessórios', icon: Gem },
  { key: 'objects', title: 'Objetos', icon: Shapes },
  { key: 'vibe', title: 'Vibe', icon: Waves },
  { key: 'typography', title: 'Tipografia', icon: Type },
  { key: 'colors', title: 'Cores', icon: Palette },
];

export function ArtistsPage({ artists, releases, onSave, onDelete }) {
  const [editingArtist, setEditingArtist] = useState(null);
  const [identityArtist, setIdentityArtist] = useState(null);
  const [showForm, setShowForm] = useState(!artists.length);
  const [formVersion, setFormVersion] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    if (!showForm || !formRef.current) return;
    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showForm, editingArtist?.id, formVersion]);

  useEffect(() => {
    if (!identityArtist) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIdentityArtist(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [identityArtist]);

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

  function openArtistEditor(artist) {
    setIdentityArtist(null);
    setEditingArtist(artist);
    setShowForm(true);
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
          const identity = getArtistIdentity(artist);
          const archetypeTags = splitIdentityTags(identity.archetypes);
          const vibeSummary = identity.vibe || identity.archetypes || 'Vibe ainda não definida.';
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
                  </div>
                </div>
                <StatusBadge>{releaseCount} lanç.</StatusBadge>
              </div>

              <div className="artist-archetype-tags" aria-label="Arquétipos do artista">
                {archetypeTags.length
                  ? archetypeTags.map((tag) => <span key={tag}>{tag}</span>)
                  : <span>Arquétipos não definidos</span>}
              </div>

              <div className="meta-list artist-card-meta">
                <span>Responsável: {artist.legalName || 'Não informado'}</span>
                <span>
                  <Mail size={14} />
                  {artist.email || 'E-mail não informado'}
                </span>
                <span>
                  <Phone size={14} />
                  {artist.phone || 'Telefone não informado'}
                </span>
              </div>

              <div className="artist-vibe-block">
                <span className="artist-card-label"><Waves size={14} /> Vibe</span>
                <p className="artist-vibe-summary">{vibeSummary}</p>
              </div>

              <div className="artist-card-colors">
                <span className="artist-card-label"><Palette size={14} /> Cores</span>
                <ColorSwatches colors={identity.colors} />
              </div>

              <div className="link-row artist-social-links">
                <ExternalLinkButton href={artist.instagram}>Instagram</ExternalLinkButton>
                <ExternalLinkButton href={artist.tiktok}>TikTok</ExternalLinkButton>
                <ExternalLinkButton href={artist.youtube}>YouTube</ExternalLinkButton>
                <ExternalLinkButton href={artist.spotify}>Spotify</ExternalLinkButton>
              </div>

              <div className="card-actions artist-card-actions">
                <button className="secondary-button artist-identity-trigger" onClick={() => setIdentityArtist(artist)} type="button">
                  <Eye size={16} />
                  <span>Ver identidade artística</span>
                </button>
                <button
                  className="secondary-button"
                  onClick={() => openArtistEditor(artist)}
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

      {identityArtist && (() => {
        const identity = getArtistIdentity(identityArtist);
        const modalTitleId = `artist-identity-${identityArtist.id}`;
        return (
          <div className="artist-identity-modal-backdrop" onMouseDown={() => setIdentityArtist(null)}>
            <section
              aria-labelledby={modalTitleId}
              aria-modal="true"
              className="artist-identity-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
            >
              <header className="artist-identity-modal-header">
                <div className="artist-identity-modal-person">
                  {identityArtist.profileImage ? (
                    <img className="artist-avatar" src={identityArtist.profileImage} alt="" />
                  ) : (
                    <div className="artist-avatar artist-avatar-fallback"><Music2 size={18} /></div>
                  )}
                  <div>
                    <span className="eyebrow">Identidade artística</span>
                    <h2 id={modalTitleId}>{identityArtist.stageName}</h2>
                    <p>{identityArtist.genre || 'Estilo musical não informado'}</p>
                  </div>
                </div>
                <button className="icon-button" onClick={() => setIdentityArtist(null)} type="button" aria-label="Fechar identidade artística">
                  <X size={20} />
                </button>
              </header>

              <div className="artist-identity-section-grid">
                {IDENTITY_SECTIONS.map(({ key, title, icon: Icon }) => (
                  <section className="artist-identity-section" key={key}>
                    <div className="artist-identity-section-title">
                      <Icon size={17} />
                      <h3>{title}</h3>
                    </div>
                    {key === 'colors' && identity.colors && <ColorSwatches colors={identity.colors} />}
                    <p>{identity[key] || 'Não informado.'}</p>
                  </section>
                ))}
              </div>

              <footer className="artist-identity-modal-actions">
                {typeof onSave === 'function' && (
                  <button className="primary-button" onClick={() => openArtistEditor(identityArtist)} type="button">
                    <Edit3 size={16} />
                    <span>Editar identidade</span>
                  </button>
                )}
                <button className="secondary-button" onClick={() => setIdentityArtist(null)} type="button">
                  Fechar
                </button>
              </footer>
            </section>
          </div>
        );
      })()}

      {!artists.length && !showForm && (
        <EmptyState
          title="Nenhum artista cadastrado"
          action={<button className="secondary-button" onClick={openNewArtist} type="button">Cadastrar artista</button>}
        />
      )}
    </section>
  );
}
