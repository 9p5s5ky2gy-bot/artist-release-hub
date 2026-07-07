import { CalendarCheck, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { releaseStatuses } from '../data/calendarTemplate';
import { addDays, formatDateInput, getLastFridayOfMonth } from '../utils/date';
import { CoverImage } from './CoverImage';

const emptyRelease = {
  artistId: '',
  songTitle: '',
  releaseDate: '',
  presaveDate: '',
  coverUrl: '',
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

export function ReleaseForm({ artists, editingRelease, onSave, onCancel }) {
  const [form, setForm] = useState(emptyRelease);
  const [customLinksText, setCustomLinksText] = useState('');

  useEffect(() => {
    const next = editingRelease || emptyRelease;
    setForm(next);
    setCustomLinksText(serializeLinks(next.customLinks));
  }, [editingRelease]);

  const selectedArtist = useMemo(
    () => artists.find((artist) => artist.id === form.artistId),
    [artists, form.artistId],
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'releaseDate' && value && !current.presaveDate) {
        next.presaveDate = formatDateInput(addDays(value, -14));
      }
      return next;
    });
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
    if (!form.artistId || !form.songTitle.trim() || !form.releaseDate) return;
    onSave({
      ...form,
      customLinks: parseLinks(customLinksText),
    });
    setForm(emptyRelease);
    setCustomLinksText('');
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
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
        <div className="cover-preview">
          <CoverImage src={form.coverUrl} alt={form.songTitle || 'Capa do lançamento'} />
          {selectedArtist && <strong>{selectedArtist.stageName}</strong>}
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
            URL da capa
            <input name="coverUrl" value={form.coverUrl} onChange={updateField} placeholder="https://..." />
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

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={!artists.length}>
          <Save size={16} />
          <span>{editingRelease ? 'Salvar lançamento' : 'Cadastrar e gerar calendário'}</span>
        </button>
      </div>
    </form>
  );
}
