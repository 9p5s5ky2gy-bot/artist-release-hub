import { ImagePlus, Save, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { optimizeImageFile } from '../utils/image';
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
  profileImageMeta: null,
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
  const [profileStatus, setProfileStatus] = useState('');

  useEffect(() => {
    setForm(normalizeArtist(editingArtist));
    setSubmitError('');
    setProfileStatus('');
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

  async function uploadProfileImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSubmitError('');
    setProfileStatus('Otimizando foto...');

    try {
      const optimized = await optimizeImageFile(file, { maxSize: 600, quality: 0.76, type: 'image/webp' });
      setForm((current) => ({
        ...current,
        profileImage: optimized.dataUrl,
        profileImageMeta: {
          name: file.name,
          size: optimized.size,
          width: optimized.width,
          height: optimized.height,
          type: optimized.type,
          updatedAt: new Date().toISOString(),
        },
      }));
      setProfileStatus('Foto pronta para salvar.');
    } catch (error) {
      setProfileStatus('');
      setSubmitError(error?.message || 'Nao foi possivel carregar a foto. Tente outra imagem.');
    }
  }

  function removeProfileImage() {
    setForm((current) => ({
      ...current,
      profileImage: '',
      profileImageMeta: null,
    }));
    setProfileStatus('Foto removida.');
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
        <div className="artist-photo-field span-2">
          <div className="artist-photo-preview" aria-label="Preview da foto do artista">
            {form.profileImage ? (
              <img src={form.profileImage} alt={form.stageName || 'Foto do artista'} />
            ) : (
              <ImagePlus size={24} />
            )}
          </div>
          <div className="cover-uploader-fields">
            <label className="upload-dropzone">
              <Upload size={17} />
              <span>Enviar foto do computador/celular</span>
              <input accept="image/*" onChange={uploadProfileImage} type="file" />
            </label>
            {form.profileImage && (
              <button className="secondary-button compact" onClick={removeProfileImage} type="button">
                <Trash2 size={15} />
                <span>Remover foto</span>
              </button>
            )}
            <div className="cover-hint">
              <ImagePlus size={16} />
              <span>{profileStatus || 'A foto e salva otimizada dentro do JSON do workspace.'}</span>
            </div>
          </div>
        </div>
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
