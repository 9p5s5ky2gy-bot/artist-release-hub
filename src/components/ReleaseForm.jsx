import { CalendarCheck, Save, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { releaseStatuses } from '../data/calendarTemplate';
import { addDays, formatDateInput, getLastFridayOfMonth } from '../utils/date';
import { getDailyActionCount, releaseTypes } from '../utils/release';
import { CoverUploader } from './CoverUploader';

const emptyRelease = {
  artistId: '',
  songTitle: '',
  releaseType: 'Single',
  dailyActionCount: 1,
  releaseDate: '',
  presaveDate: '',
  coverUrl: '',
  coverImageUrl: '',
  coverImage: '',
  coverImageMeta: null,
  presaveLink: '',
  spotifyLink: '',
  youtubeLink: '',
  tiktokLink: '',
  instagramLink: '',
  driveLink: '',
  canvaLink: '',
  customLinks: [],
  notes: '',
  status: 'planejamento',
  shouldGenerateRandomPlan: false,
};

function serializeLinks(links = []) {
  return links.map((link) => `${link.label} | ${link.url}`).join('\n');
}

function parseLinks(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...urlParts] = line.includes('|') ? line.split('|') : line.split(',');
      return {
        label: label?.trim() || 'Link',
        url: urlParts.join('|').trim(),
      };
    })
    .filter((link) => link.url);
}

function normalizeFormRelease(release) {
  return {
    ...emptyRelease,
    ...(release || {}),
    releaseType: release?.releaseType || release?.type || 'Single',
    dailyActionCount: getDailyActionCount(release),
    coverUrl: release?.coverUrl || release?.coverImageUrl || '',
    shouldGenerateRandomPlan: false,
  };
}

export function ReleaseForm({ artists, editingRelease, onSave, onCancel }) {
  const [form, setForm] = useState(emptyRelease);
  const [customLinksText, setCustomLinksText] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const next = normalizeFormRelease(editingRelease);
    setForm(next);
    setCustomLinksText(serializeLinks(next.customLinks));
    setSubmitError('');
  }, [editingRelease]);

  const selectedArtist = useMemo(
    () => artists.find((artist) => artist.id === form.artistId),
    [artists, form.artistId],
  );

  function updateField(event) {
    setSubmitError('');
    const { checked, name, type, value } = event.target;
    setForm((current) => {
      const fieldValue = type === 'checkbox' ? checked : value;
      const next = { ...current, [name]: fieldValue };
      if (name === 'releaseDate' && value && !current.presaveDate) {
        next.presaveDate = formatDateInput(addDays(value, -14));
      }
      return next;
    });
  }

  function updateCover(patch) {
    setSubmitError('');
    setForm((current) => ({ ...current, ...patch }));
  }

  function applyLastFriday() {
    setForm((current) => {
      const releaseDate = getLastFridayOfMonth(current.releaseDate || new Date());
      return {
        ...current,
        releaseDate,
        presaveDate: formatDateInput(addDays(releaseDate, -14)),
      };
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const songTitle = form.songTitle.trim();

    if (!form.artistId) {
      setSubmitError('Selecione um artista para cadastrar o lançamento.');
      return;
    }

    if (!songTitle) {
      setSubmitError('Digite o nome da música antes de cadastrar.');
      return;
    }

    if (!form.releaseDate) {
      setSubmitError('Escolha a data de lançamento antes de cadastrar.');
      return;
    }

    try {
      onSave({
        ...form,
        songTitle,
        customLinks: parseLinks(customLinksText),
      });
      setForm(emptyRelease);
      setCustomLinksText('');
      setSubmitError('');
    } catch (error) {
      setSubmitError(error?.message || 'Não foi possível cadastrar o lançamento. Revise os campos e tente novamente.');
    }
  }

  return (
    <form className="form-panel" noValidate onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">{editingRelease ? 'Editar lançamento' : 'Novo lançamento'}</span>
          <h2>{editingRelease ? editingRelease.songTitle : 'Cadastro de lançamento'}</h2>
        </div>
        {editingRelease && (
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Cancelar edição">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="release-form-layout">
        <div className="cover-column">
          <CoverUploader release={form} onChange={updateCover} />
          {selectedArtist && <strong className="selected-artist-name">{selectedArtist.stageName}</strong>}
        </div>

        <div className="form-grid">
          <label>
            Artista relacionado
            <select name="artistId" value={form.artistId} onChange={updateField} required>
              <option value="">Selecione</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.stageName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nome da música
            <input name="songTitle" value={form.songTitle} onChange={updateField} required />
          </label>
          <label>
            Tipo do lançamento
            <select name="releaseType" value={form.releaseType} onChange={updateField}>
              {releaseTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Ações/postagens por dia
            <select name="dailyActionCount" value={form.dailyActionCount} onChange={updateField}>
              <option value="1">1 por dia</option>
              <option value="2">2 por dia</option>
              <option value="3">3 por dia</option>
            </select>
          </label>
          <label>
            Status do lançamento
            <select name="status" value={form.status} onChange={updateField}>
              {releaseStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data de lançamento
            <span className="date-action-field">
              <input type="date" name="releaseDate" value={form.releaseDate} onChange={updateField} required />
              <button className="secondary-button compact" type="button" onClick={applyLastFriday}>
                <CalendarCheck size={15} />
                <span>Última sexta</span>
              </button>
            </span>
          </label>
          <label>
            Início do pré-save
            <input type="date" name="presaveDate" value={form.presaveDate} onChange={updateField} />
          </label>
          <label className="span-2 checkbox-card-label">
            <input
              checked={form.shouldGenerateRandomPlan}
              name="shouldGenerateRandomPlan"
              onChange={updateField}
              type="checkbox"
            />
            <span>
              <Sparkles size={16} />
              Gerar plano automático com sugestões IA ao salvar
            </span>
          </label>
          <label>
            Link do pré-save
            <input name="presaveLink" value={form.presaveLink} onChange={updateField} placeholder="https://..." />
          </label>
          <label>
            Link do Spotify
            <input name="spotifyLink" value={form.spotifyLink} onChange={updateField} placeholder="https://open.spotify.com/..." />
          </label>
          <label>
            Link do YouTube
            <input name="youtubeLink" value={form.youtubeLink} onChange={updateField} placeholder="https://youtube.com/..." />
          </label>
          <label>
            Link do TikTok
            <input name="tiktokLink" value={form.tiktokLink} onChange={updateField} placeholder="https://tiktok.com/..." />
          </label>
          <label>
            Link do Instagram
            <input name="instagramLink" value={form.instagramLink} onChange={updateField} placeholder="https://instagram.com/..." />
          </label>
          <label>
            Link do Google Drive
            <input name="driveLink" value={form.driveLink} onChange={updateField} placeholder="https://drive.google.com/..." />
          </label>
          <label>
            Link do Canva
            <input name="canvaLink" value={form.canvaLink} onChange={updateField} placeholder="https://canva.com/..." />
          </label>
          <label className="span-2">
            Outros links personalizados
            <textarea
              value={customLinksText}
              onChange={(event) => setCustomLinksText(event.target.value)}
              rows="3"
              placeholder="Press kit | https://..."
            />
          </label>
          <label className="span-2">
            Observações gerais
            <textarea name="notes" value={form.notes} onChange={updateField} rows="4" />
          </label>
        </div>
      </div>

      {submitError && <p className="form-error" role="alert">{submitError}</p>}

      <div className="form-actions">
        <button className="primary-button release-submit-button" formNoValidate type="submit">
          <Save size={16} />
          <span>{editingRelease ? 'Salvar lançamento' : 'Cadastrar lançamento'}</span>
        </button>
      </div>
    </form>
  );
}
