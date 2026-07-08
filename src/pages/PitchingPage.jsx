import {
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  FileText,
  Languages,
  Mail,
  RefreshCcw,
  Save,
  Send,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatHumanDate } from '../utils/date';
import { createId } from '../utils/id';
import {
  buildPitchContext,
  buildPitchExport,
  generatePitch,
  getDefaultBrief,
  getPitchDateAlert,
  getPitchKey,
  pitchChecklistItems,
  pitchTypes,
  scorePitchQuality,
  suggestPlaylists,
} from '../utils/pitching';
import { getReleaseType } from '../utils/release';

const artistFields = [
  { name: 'cityCountry', label: 'Cidade/paÃ­s' },
  { name: 'primaryGenre', label: 'GÃªnero principal' },
  { name: 'subgenres', label: 'SubgÃªneros' },
  { name: 'shortBio', label: 'Bio curta', textarea: true },
  { name: 'artistSpotify', label: 'Spotify' },
  { name: 'artistInstagram', label: 'Instagram' },
  { name: 'artistTiktok', label: 'TikTok' },
  { name: 'artistYoutube', label: 'YouTube' },
  { name: 'deezer', label: 'Deezer' },
  { name: 'appleMusic', label: 'Apple Music' },
  { name: 'totalStreams', label: 'NÃºmero total de streams' },
  { name: 'monthlyListeners', label: 'Ouvintes mensais' },
  { name: 'spotifyFollowers', label: 'Seguidores no Spotify' },
  { name: 'instagramFollowers', label: 'Seguidores no Instagram' },
  { name: 'tiktokFollowers', label: 'Seguidores no TikTok' },
  { name: 'collaborations', label: 'ColaboraÃ§Ãµes relevantes', textarea: true },
  { name: 'previousPlaylists', label: 'Playlists anteriores', textarea: true },
  { name: 'achievements', label: 'Conquistas relevantes', textarea: true },
  { name: 'archetypes', label: 'ArquÃ©tipos' },
  { name: 'editorialLines', label: 'Linhas editoriais', textarea: true },
  { name: 'targetAudience', label: 'PÃºblico-alvo', textarea: true },
  { name: 'internalNotes', label: 'Notas internas', textarea: true },
];

const releaseFields = [
  { name: 'songLanguage', label: 'Idioma da mÃºsica', type: 'select', options: ['AutomÃ¡tico', 'PortuguÃªs', 'InglÃªs', 'Espanhol', 'Outro'] },
  { name: 'releaseGenre', label: 'GÃªnero' },
  { name: 'releaseSubgenre', label: 'SubgÃªnero' },
  { name: 'mood', label: 'Mood' },
  { name: 'energy', label: 'Energia' },
  { name: 'lyricTheme', label: 'Tema da letra' },
  { name: 'narrative', label: 'Narrativa', textarea: true },
  { name: 'description', label: 'DescriÃ§Ã£o da mÃºsica', textarea: true },
  { name: 'inspiration', label: 'InspiraÃ§Ã£o', textarea: true },
  { name: 'feat', label: 'Feat' },
  { name: 'producer', label: 'Produtor' },
  { name: 'composer', label: 'Compositor' },
  { name: 'hasClip', label: 'Clipe', type: 'select', options: ['', 'sim', 'nÃ£o'] },
  { name: 'clipDate', label: 'Data do clipe', type: 'date' },
  { name: 'presaveActive', label: 'PrÃ©-save ativo', type: 'select', options: ['', 'sim', 'nÃ£o'] },
  { name: 'presaveLink', label: 'Link do prÃ©-save' },
  { name: 'musicLink', label: 'Link da mÃºsica' },
  { name: 'youtubeLink', label: 'Link do YouTube' },
  { name: 'promotionPlan', label: 'Plano de divulgaÃ§Ã£o', textarea: true },
  { name: 'paidTraffic', label: 'TrÃ¡fego pago', type: 'select', options: ['', 'sim', 'nÃ£o'] },
  { name: 'trafficBudget', label: 'OrÃ§amento de trÃ¡fego' },
  { name: 'fanActions', label: 'AÃ§Ãµes de fÃ£s', textarea: true },
  { name: 'socialCampaign', label: 'Campanha nas redes sociais', textarea: true },
  { name: 'influencers', label: 'Influenciadores' },
  { name: 'blogs', label: 'Blogs/pÃ¡ginas' },
  { name: 'desiredPlaylists', label: 'Playlists desejadas', textarea: true },
  { name: 'notes', label: 'ObservaÃ§Ãµes', textarea: true },
];

function renderField(field, value, onChange) {
  if (field.type === 'select') {
    return (
      <select value={value || ''} onChange={(event) => onChange(field.name, event.target.value)}>
        {field.options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'NÃ£o informado'}
          </option>
        ))}
      </select>
    );
  }

  if (field.textarea) {
    return <textarea value={value || ''} onChange={(event) => onChange(field.name, event.target.value)} rows={3} />;
  }

  return <input type={field.type || 'text'} value={value || ''} onChange={(event) => onChange(field.name, event.target.value)} />;
}

function ScoreBox({ score }) {
  return (
    <div className="pitch-score-box">
      <div>
        <span>Qualidade do pitch</span>
        <strong>{score.score}/100</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${score.score}%` }} />
      </div>
      <div className="pitch-score-lists">
        <div>
          <strong>Pontos fortes</strong>
          {score.strong.length ? score.strong.map((item) => <span key={item}>+ {item}</span>) : <span>Gere um pitch para avaliar.</span>}
        </div>
        <div>
          <strong>Melhorar</strong>
          {score.improve.length ? score.improve.map((item) => <span key={item}>- {item}</span>) : <span>Boa base para envio.</span>}
        </div>
      </div>
    </div>
  );
}

function PitchCard({ draft, score, copied, saved, onCopy, onChange, onSave, onRegenerate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const count = draft.text.length;

  return (
    <article className="pitch-card">
      <div className="pitch-card-head">
        <div>
          <span className="eyebrow">{draft.language === 'en' ? 'InglÃªs' : 'PortuguÃªs'}</span>
          <h3>{draft.title}</h3>
        </div>
        <StatusBadge tone={count <= draft.characterLimit ? 'mint' : 'red'}>
          {count}/{draft.characterLimit || 'sem limite'}
        </StatusBadge>
      </div>

      {editing ? (
        <textarea
          className="pitch-editor"
          value={draft.text}
          onChange={(event) => onChange({ ...draft, text: event.target.value })}
          rows={8}
        />
      ) : (
        <div className="pitch-text-preview">{draft.text}</div>
      )}

      <ScoreBox score={score} />

      <div className="pitch-card-actions">
        <button className="secondary-button compact" onClick={() => onCopy(draft.text, draft.id)} type="button">
          <Copy size={14} />
          <span>{copied === draft.id ? 'Copiado' : 'Copiar'}</span>
        </button>
        <button className="secondary-button compact" onClick={() => setEditing((value) => !value)} type="button">
          <Edit3 size={14} />
          <span>{editing ? 'Concluir ediÃ§Ã£o' : 'Editar'}</span>
        </button>
        <button className="secondary-button compact" onClick={() => onRegenerate(draft)} type="button">
          <RefreshCcw size={14} />
          <span>Regenerar</span>
        </button>
        {onSave && (
          <button className="primary-button compact" onClick={() => onSave(draft)} type="button">
            <Save size={14} />
            <span>Salvar versÃ£o</span>
          </button>
        )}
        {saved && (
          <button className="danger-button compact" onClick={() => onDelete(draft.id)} type="button">
            <Trash2 size={14} />
            <span>Excluir</span>
          </button>
        )}
      </div>
    </article>
  );
}

export function PitchingPage({
  artists,
  releases,
  pitching,
  pitchBriefs,
  pitchChecklists,
  onSavePitch,
  onUpdatePitch,
  onDeletePitch,
  onSaveBrief,
  onSetPitchChecklist,
}) {
  const [selectedArtistId, setSelectedArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(
    () => releases.filter((release) => !selectedArtistId || release.artistId === selectedArtistId),
    [releases, selectedArtistId],
  );
  const [selectedReleaseId, setSelectedReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [drafts, setDrafts] = useState([]);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!artists.length) {
      setSelectedArtistId('');
      return;
    }
    if (!artists.some((artist) => artist.id === selectedArtistId)) {
      setSelectedArtistId(artists[0].id);
    }
  }, [artists, selectedArtistId]);

  useEffect(() => {
    const available = releases.filter((release) => !selectedArtistId || release.artistId === selectedArtistId);
    if (!available.length) {
      setSelectedReleaseId('');
      return;
    }
    if (!available.some((release) => release.id === selectedReleaseId)) {
      setSelectedReleaseId(available[0].id);
    }
  }, [releases, selectedArtistId, selectedReleaseId]);

  const selectedArtist = artists.find((artist) => artist.id === selectedArtistId) || null;
  const selectedRelease = releases.find((release) => release.id === selectedReleaseId) || null;
  const pitchKey = getPitchKey(selectedArtistId, selectedReleaseId);
  const brief = useMemo(
    () => ({
      ...getDefaultBrief(selectedArtist || {}, selectedRelease || {}),
      ...(pitchBriefs[pitchKey] || {}),
    }),
    [pitchBriefs, pitchKey, selectedArtist, selectedRelease],
  );
  const context = useMemo(() => buildPitchContext(selectedArtist || {}, selectedRelease || {}, brief), [selectedArtist, selectedRelease, brief]);
  const playlists = useMemo(() => suggestPlaylists(context), [context]);
  const checklist = pitchChecklists[pitchKey] || {};
  const savedVersions = pitching.filter((item) => item.artistId === selectedArtistId && item.releaseId === selectedReleaseId);
  const primaryScore = scorePitchQuality(context, drafts[0] || { text: '', characterLimit: 500 });
  const checklistDone = pitchChecklistItems.filter((item) => checklist[item.id]).length;

  useEffect(() => {
    setDrafts([]);
  }, [pitchKey]);

  function updateBrief(field, value) {
    onSaveBrief(pitchKey, { [field]: value });
  }

  function makeDraft(type, language = 'auto') {
    const generated = generatePitch({ type, context, playlists, language });
    return {
      ...generated,
      id: createId('pitch-draft'),
      artistId: selectedArtistId,
      releaseId: selectedReleaseId,
      characterCount: generated.text.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
    };
  }

  function upsertDraft(nextDraft) {
    setDrafts((current) => [
      nextDraft,
      ...current.filter((draft) => !(draft.type === nextDraft.type && draft.language === nextDraft.language)),
    ]);
  }

  function generateOne(type, language = 'auto') {
    if (!selectedArtist || !selectedRelease) return;
    upsertDraft(makeDraft(type, language));
  }

  function generateAll(language = 'auto') {
    if (!selectedArtist || !selectedRelease) return;
    setDrafts(pitchTypes.map((type) => makeDraft(type.id, language)));
  }

  function updateDraft(nextDraft) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === nextDraft.id
          ? { ...nextDraft, characterCount: nextDraft.text.length, updatedAt: new Date().toISOString() }
          : draft,
      ),
    );
  }

  function saveDraft(draft) {
    onSavePitch({
      ...draft,
      id: createId('pitch'),
      characterCount: draft.text.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  function regenerateDraft(draft) {
    const nextDraft = makeDraft(draft.type, draft.language);
    if (!draft.id.startsWith('pitch-draft')) {
      onUpdatePitch(draft.id, {
        ...nextDraft,
        id: draft.id,
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    updateDraft({ ...nextDraft, id: draft.id });
  }

  async function copyText(value, id) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(id);
    window.setTimeout(() => setCopied(''), 1400);
  }

  function copyEverything() {
    copyText(buildPitchExport({ context, drafts: drafts.length ? drafts : savedVersions, playlists, checklist }), 'all');
  }

  function downloadEverything() {
    const content = buildPitchExport({ context, drafts: drafts.length ? drafts : savedVersions, playlists, checklist });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pitch-${context.artistName}-${context.songTitle}.txt`.replace(/[^\w.-]+/g, '-').toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!artists.length) {
    return (
      <section className="page-content">
        <PageHeader eyebrow="Pitching" title="Assistente de pitching" />
        <EmptyState title="Cadastre um artista primeiro" text="O pitch precisa de pelo menos um artista cadastrado." />
      </section>
    );
  }

  if (!releases.length) {
    return (
      <section className="page-content">
        <PageHeader eyebrow="Pitching" title="Assistente de pitching" />
        <EmptyState title="Cadastre um lanÃ§amento primeiro" text="Depois vocÃª poderÃ¡ gerar pitches para Spotify, curadores, blogs e distribuidora." />
      </section>
    );
  }

  return (
    <section className="page-content pitching-page">
      <PageHeader eyebrow="Pitching" title="Assistente de pitching musical">
        <button className="secondary-button" onClick={copyEverything} type="button">
          <Copy size={16} />
          <span>{copied === 'all' ? 'Copiado' : 'Copiar tudo'}</span>
        </button>
        <button className="primary-button" onClick={downloadEverything} type="button">
          <Download size={16} />
          <span>Baixar .txt</span>
        </button>
      </PageHeader>

      <section className="pitching-selector panel">
        <label>
          Artista
          <select value={selectedArtistId} onChange={(event) => setSelectedArtistId(event.target.value)}>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.stageName}
              </option>
            ))}
          </select>
        </label>
        <label>
          LanÃ§amento
          <select value={selectedReleaseId} onChange={(event) => setSelectedReleaseId(event.target.value)}>
            {artistReleases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.songTitle}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="stats-grid">
        <StatCard label="VersÃµes salvas" value={savedVersions.length} icon={FileText} tone="mint" />
        <StatCard label="Checklist" value={`${checklistDone}/${pitchChecklistItems.length}`} icon={ClipboardList} tone="blue" />
        <StatCard label="Score atual" value={`${primaryScore.score}/100`} icon={Target} tone="yellow" />
        <StatCard label="Playlists sugeridas" value={playlists.length} icon={Sparkles} tone="coral" />
      </div>

      <section className="pitching-summary-grid">
        <article className="panel pitch-release-summary">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Resumo do lanÃ§amento</span>
              <h2>{context.artistName} Â· {context.songTitle}</h2>
            </div>
            <StatusBadge>{getReleaseType(selectedRelease)}</StatusBadge>
          </div>
          <p>{context.description || context.narrative || 'Adicione descriÃ§Ã£o, mood e plano de divulgaÃ§Ã£o para fortalecer o pitch.'}</p>
          <div className="pitch-mini-list">
            <span>LanÃ§amento: <strong>{formatHumanDate(selectedRelease?.releaseDate)}</strong></span>
            <span>GÃªnero: <strong>{context.releaseGenre || 'nÃ£o informado'}</strong></span>
            <span>Mood: <strong>{context.mood || 'nÃ£o informado'}</strong></span>
            <span>PrÃ©-save: <strong>{context.hasPresave ? 'sim' : 'nÃ£o informado'}</strong></span>
          </div>
        </article>

        <article className="panel pitch-alert-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Alerta de data</span>
              <h2>Momento de envio</h2>
            </div>
            <StatusBadge tone="blue">orientaÃ§Ã£o</StatusBadge>
          </div>
          <p>{getPitchDateAlert(selectedRelease?.releaseDate)}</p>
          <ScoreBox score={primaryScore} />
        </article>
      </section>

      <section className="panel pitch-brief-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Briefing</span>
            <h2>Preencher ou revisar informaÃ§Ãµes</h2>
          </div>
          <StatusBadge tone="neutral">salvo no JSON</StatusBadge>
        </div>

        <div className="pitch-brief-columns">
          <div>
            <h3>Artista</h3>
            <div className="pitch-form-grid">
              {artistFields.map((field) => (
                <label className={field.textarea ? 'span-2' : ''} key={field.name}>
                  {field.label}
                  {renderField(field, brief[field.name], updateBrief)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3>LanÃ§amento</h3>
            <div className="pitch-form-grid">
              {releaseFields.map((field) => (
                <label className={field.textarea ? 'span-2' : ''} key={field.name}>
                  {field.label}
                  {renderField(field, brief[field.name], updateBrief)}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel pitch-generator-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Gerador interno</span>
            <h2>Gerar pitch automÃ¡tico</h2>
          </div>
          <StatusBadge tone="mint">sem API externa</StatusBadge>
        </div>

        <div className="pitch-actions-grid">
          <button className="primary-button" onClick={() => generateOne('spotify')} type="button">
            <Send size={16} />
            <span>Gerar pitch Spotify</span>
          </button>
          <button className="secondary-button" onClick={() => generateOne('distributor')} type="button">
            <FileText size={16} />
            <span>Gerar pitch distribuidora</span>
          </button>
          <button className="secondary-button" onClick={() => generateOne('curator')} type="button">
            <Target size={16} />
            <span>Gerar pitch curador</span>
          </button>
          <button className="secondary-button" onClick={() => generateOne('blog')} type="button">
            <FileText size={16} />
            <span>Gerar blog/release</span>
          </button>
          <button className="secondary-button" onClick={() => generateOne('email')} type="button">
            <Mail size={16} />
            <span>Gerar e-mail</span>
          </button>
          <button className="secondary-button" onClick={() => generateAll('en')} type="button">
            <Languages size={16} />
            <span>Gerar em inglÃªs</span>
          </button>
          <button className="secondary-button" onClick={() => generateAll('pt')} type="button">
            <Languages size={16} />
            <span>Gerar em portuguÃªs</span>
          </button>
          <button className="primary-button" onClick={() => generateAll()} type="button">
            <Sparkles size={16} />
            <span>Gerar todos</span>
          </button>
        </div>
      </section>

      <section className="pitch-content-grid">
        <article className="panel pitch-playlists-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Playlists compatÃ­veis</span>
              <h2>ReferÃªncias de compatibilidade</h2>
            </div>
          </div>
          <p className="muted-copy">Essas playlists sÃ£o referÃªncias de compatibilidade. Analise mood, arranjo, idioma e energia antes de fazer pitch.</p>
          <div className="playlist-suggestion-list">
            {playlists.map((playlist) => (
              <div className="playlist-suggestion-card" key={playlist.name}>
                <div>
                  <strong>{playlist.name}</strong>
                  <StatusBadge tone={playlist.compatibility === 'alta' ? 'mint' : playlist.compatibility === 'mÃ©dia' ? 'yellow' : 'blue'}>
                    {playlist.compatibility}
                  </StatusBadge>
                </div>
                <p>{playlist.reason}</p>
                <span>Destacar: {playlist.highlight}</span>
                <small>{playlist.note}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel pitch-checklist-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Checklist de pitch</span>
              <h2>PreparaÃ§Ã£o</h2>
            </div>
            <StatusBadge tone="blue">{checklistDone}/{pitchChecklistItems.length}</StatusBadge>
          </div>
          <div className="pitch-checklist">
            {pitchChecklistItems.map((item) => (
              <label key={item.id}>
                <input
                  checked={Boolean(checklist[item.id])}
                  onChange={(event) => onSetPitchChecklist(pitchKey, item.id, event.target.checked)}
                  type="checkbox"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </article>
      </section>

      <section className="pitch-results-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">Pitches gerados</span>
            <h2>Rascunhos editÃ¡veis</h2>
          </div>
          <StatusBadge tone="neutral">{drafts.length} card(s)</StatusBadge>
        </div>
        <div className="pitch-card-grid">
          {drafts.map((draft) => (
            <PitchCard
              copied={copied}
              draft={draft}
              key={draft.id}
              onChange={updateDraft}
              onCopy={copyText}
              onRegenerate={regenerateDraft}
              onSave={saveDraft}
              score={scorePitchQuality(context, draft)}
            />
          ))}
        </div>
        {!drafts.length && <EmptyState title="Nenhum pitch gerado ainda" text="Use os botÃµes acima para gerar o primeiro rascunho." />}
      </section>

      <section className="pitch-results-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">VersÃµes salvas</span>
            <h2>HistÃ³rico deste lanÃ§amento</h2>
          </div>
          <StatusBadge tone="mint">{savedVersions.length} salva(s)</StatusBadge>
        </div>
        <div className="pitch-card-grid">
          {savedVersions.map((version) => (
            <PitchCard
              copied={copied}
              draft={version}
              key={version.id}
              onChange={(nextVersion) => onUpdatePitch(version.id, nextVersion)}
              onCopy={copyText}
              onDelete={onDeletePitch}
              onRegenerate={regenerateDraft}
              saved
              score={scorePitchQuality(context, version)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
