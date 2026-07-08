import { Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PlatformArtistSearch } from './PlatformArtistSearch';

const emptyArtist = {
  stageName: '',
  legalName: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  spotify: '',
  spotifyId: '',
  profileImage: '',
  platformProfiles: {},
  email: '',
  phone: '',
  notes: '',
  genre: '',
  archetype: '',
  editorialLines: '',
  visualColors: '',
};

function normalizeArtist(artist) {
  return {
    ...emptyArtist,
    ...(artist || {}),
    platformProfiles: artist?.platformProfiles || {},
  };
}

export function ArtistForm({ editingArtist, onSave, onCancel }) {
  const [form, setForm] = useState(emptyArtist);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setForm(normalizeArtist(editingArtist));
    setSubmitError('');
  }, [editingArtist]);

  function updateField(event) {
    setSubmitError('');
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectPlatformArtist(artist) {
    setForm((current) => ({
      ...current,
      stageName: artist.name || current.stageName,
      spotify: artist.url || current.spotify,
      spotifyId: artist.platformId || current.spotifyId,
      profileImage: artist.image || current.profileImage,
      platformProfiles: {
        ...(current.platformProfiles || {}),
        spotify: artist,
      },
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const stageName = form.stageName.trim();

    if (!stageName) {
      setSubmitError('Digite o nome artístico antes de cadastrar.');
      return;
    }

    try {
      onSave({ ...form, stageName });
      setForm(emptyArtist);
      setSubmitError('');
    } catch (error) {
      setSubmitError(error?.message || 'Não foi possível salvar o artista. Revise os campos e tente novamente.');
    }
  }

  return (
    <form className="form-panel" noValidate onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">{editingArtist ? 'Editar artista' : 'Novo artista'}</span>
          <h2>{editingArtist ? editingArtist.stageName : 'Cadastro de artista'}</h2>
        </div>
        {editingArtist && (
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Cancelar edição">
            <X size={18} />
          </button>
        )}
      </div>

      <PlatformArtistSearch stageName={form.stageName} onSelect={selectPlatformArtist} />

      <div className="form-grid">
        <label>
          Nome artístico
          <input name="stageName" value={form.stageName} onChange={updateField} required />
        </label>
        <label>
          Nome real ou responsável
          <input name="legalName" value={form.legalName} onChange={updateField} />
        </label>
        <label>
          Instagram
          <input name="instagram" value={form.instagram} onChange={updateField} placeholder="https://instagram.com/..." />
        </label>
        <label>
          TikTok
          <input name="tiktok" value={form.tiktok} onChange={updateField} placeholder="https://tiktok.com/@..." />
        </label>
        <label>
          YouTube
          <input name="youtube" value={form.youtube} onChange={updateField} placeholder="https://youtube.com/@..." />
        </label>
        <label>
          Spotify
          <input name="spotify" value={form.spotify} onChange={updateField} placeholder="https://open.spotify.com/artist/..." />
        </label>
        <label>
          ID do Spotify
          <input name="spotifyId" value={form.spotifyId} onChange={updateField} placeholder="ID do artista no Spotify" />
        </label>
        <label>
          Foto do perfil
          <input name="profileImage" value={form.profileImage} onChange={updateField} placeholder="https://..." />
        </label>
        <label>
          E-mail
          <input type="email" name="email" value={form.email} onChange={updateField} />
        </label>
        <label>
          Telefone
          <input name="phone" value={form.phone} onChange={updateField} />
        </label>
        <label>
          Estilo musical
          <input name="genre" value={form.genre} onChange={updateField} placeholder="Pop, funk, trap, MPB..." />
        </label>
        <label>
          Arquétipo ou estética
          <input name="archetype" value={form.archetype} onChange={updateField} placeholder="Era futurista, romântico..." />
        </label>
        <label className="span-2">
          Linhas editoriais
          <textarea
            name="editorialLines"
            value={form.editorialLines}
            onChange={updateField}
            rows="3"
            placeholder="Ex.: bastidores, estetica da era, humor, performance, interacao com fas"
          />
        </label>
        <label className="span-2">
          Cores principais
          <input name="visualColors" value={form.visualColors} onChange={updateField} placeholder="#59e3a7, #ff6b6b, #15181f" />
        </label>
        <label className="span-2">
          Observações
          <textarea name="notes" value={form.notes} onChange={updateField} rows="4" />
        </label>
      </div>

      {submitError && <p className="form-error" role="alert">{submitError}</p>}

      <div className="form-actions">
        <button className="primary-button" formNoValidate type="submit">
          <Save size={16} />
          <span>{editingArtist ? 'Salvar artista' : 'Cadastrar artista'}</span>
        </button>
      </div>
    </form>
  );
}
