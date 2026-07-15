import { Copy, FileText, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { briefingTypes, generateBriefing } from '../utils/proModules';
import { createId } from '../utils/id';

function copyText(text, onCopied) {
  navigator.clipboard?.writeText(text).then(onCopied).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    onCopied();
  });
}

export function BriefingsPage({ artists, releases, planDays, briefings, onSaveBriefing, onUpdateBriefing, onDeleteBriefing }) {
  const [artistId, setArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(() => releases.filter((release) => !artistId || release.artistId === artistId), [releases, artistId]);
  const [releaseId, setReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [type, setType] = useState('cover');
  const [extra, setExtra] = useState('');
  const [draft, setDraft] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (artists.length && !artists.some((artist) => artist.id === artistId)) setArtistId(artists[0].id);
  }, [artists, artistId]);
  useEffect(() => {
    const available = releases.filter((release) => !artistId || release.artistId === artistId);
    if (available.length && !available.some((release) => release.id === releaseId)) setReleaseId(available[0].id);
  }, [releases, artistId, releaseId]);

  const artist = artists.find((item) => item.id === artistId) || {};
  const release = releases.find((item) => item.id === releaseId) || {};
  const saved = briefings.filter((item) => item.artistId === artistId && item.releaseId === releaseId);

  function generate() {
    if (!artist.id || !release.id) return;
    setDraft({ ...generateBriefing({ type, artist, release, planDays, extra }), id: createId('briefing-draft'), artistId, releaseId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  function saveDraft() {
    if (!draft) return;
    onSaveBriefing({ ...draft, id: createId('briefing'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  if (!artists.length || !releases.length) return <section className="page-content"><PageHeader eyebrow="Briefings" title="Gerador de briefings" /><EmptyState title="Cadastre artista e lancamento" text="Briefings usam narrativa, datas, links, capa e estrategia existentes." /></section>;

  return (
    <section className="page-content pro-page">
      <PageHeader eyebrow="Briefings" title="Gerador de briefings profissionais">
        <button className="secondary-button" onClick={() => window.print()} type="button"><Printer size={16} />Imprimir</button>
      </PageHeader>

      <section className="pro-selector panel multi">
        <label>Artista<select value={artistId} onChange={(event) => setArtistId(event.target.value)}>{artists.map((item) => <option key={item.id} value={item.id}>{item.stageName}</option>)}</select></label>
        <label>Lancamento<select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>{artistReleases.map((item) => <option key={item.id} value={item.id}>{item.songTitle}</option>)}</select></label>
        <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}>{briefingTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="primary-button align-end" onClick={generate} type="button"><Sparkles size={16} />Gerar briefing</button>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Informacoes adicionais</span><h2>Campos opcionais</h2></div><StatusBadge>salvo apenas se gerar versao</StatusBadge></div>
        <textarea value={extra} onChange={(event) => setExtra(event.target.value)} rows={4} placeholder="Referencias, prazos, restricoes, equipe, formatos ou observacoes que nao estao no cadastro." />
      </section>

      {draft && <section className="panel pro-document print-card"><div className="panel-heading"><div><span className="eyebrow">Rascunho</span><h2>{draft.title}</h2></div><StatusBadge>{briefingTypes.find((item) => item.id === draft.type)?.label}</StatusBadge></div><textarea className="pro-document-editor" value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value, updatedAt: new Date().toISOString() }))} rows={18} /><div className="pro-actions-row"><button className="secondary-button" onClick={() => copyText(draft.content, () => setCopied(draft.id))} type="button"><Copy size={16} />{copied === draft.id ? 'Copiado' : 'Copiar'}</button><button className="primary-button" onClick={saveDraft} type="button"><Save size={16} />Salvar versao</button></div></section>}

      <section className="pro-stack">
        <div className="section-title-row"><div><span className="eyebrow">Versoes salvas</span><h2>Historico de briefings</h2></div><StatusBadge>{saved.length} versao(oes)</StatusBadge></div>
        {saved.map((item) => <article className="panel pro-document" key={item.id}><div className="panel-heading"><div><span className="eyebrow">{item.type}</span><h2>{item.title}</h2></div><button className="danger-button compact" onClick={() => onDeleteBriefing(item.id)} type="button"><Trash2 size={14} />Excluir</button></div><textarea className="pro-document-editor" value={item.content} onChange={(event) => onUpdateBriefing(item.id, { content: event.target.value, updatedAt: new Date().toISOString() })} rows={10} /><div className="pro-actions-row"><button className="secondary-button compact" onClick={() => copyText(item.content, () => setCopied(item.id))} type="button"><Copy size={14} />{copied === item.id ? 'Copiado' : 'Copiar'}</button><button className="secondary-button compact" onClick={() => window.print()} type="button"><Printer size={14} />Imprimir</button></div></article>)}
        {!saved.length && <EmptyState title="Nenhum briefing salvo" text="Gere um briefing e salve a primeira versao." />}
      </section>
    </section>
  );
}
