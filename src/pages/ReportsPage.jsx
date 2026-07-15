import { Copy, FileText, Printer, Save, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { createId } from '../utils/id';
import { generateReport, reportTypes } from '../utils/proModules';

function copyText(text, done) {
  navigator.clipboard?.writeText(text).then(done).catch(() => done());
}

export function ReportsPage({ artists, releases, planDays, tasks, pitching, pitchChecklists, reports, onSaveReport, onUpdateReport, onDeleteReport }) {
  const [artistId, setArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(() => releases.filter((release) => !artistId || release.artistId === artistId), [releases, artistId]);
  const [releaseId, setReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [type, setType] = useState('complete');
  const [draft, setDraft] = useState(null);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => { if (artists.length && !artists.some((artist) => artist.id === artistId)) setArtistId(artists[0].id); }, [artists, artistId]);
  useEffect(() => { const available = releases.filter((release) => !artistId || release.artistId === artistId); if (available.length && !available.some((release) => release.id === releaseId)) setReleaseId(available[0].id); }, [releases, artistId, releaseId]);

  const artist = artists.find((item) => item.id === artistId) || {};
  const release = releases.find((item) => item.id === releaseId) || {};
  const saved = reports.filter((item) => item.artistId === artistId && item.releaseId === releaseId);

  function generate() {
    const generated = generateReport({ type, artist, release, planDays, tasks, pitching, pitchChecklists });
    setDraft({ ...generated, id: createId('report-draft'), artistId, releaseId, notes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  function saveDraft() {
    if (!draft) return;
    onSaveReport({ ...draft, id: createId('report'), notes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  if (!artists.length || !releases.length) return <section className="page-content"><PageHeader eyebrow="Relatorios" title="Relatorios de lancamento" /><EmptyState title="Cadastre artista e lancamento" text="Os relatorios usam estrategia, pitching, diagnostico, financeiro e links." /></section>;

  return (
    <section className="page-content pro-page reports-page">
      <PageHeader eyebrow="Relatorios" title="Relatorios completos do lancamento"><button className="secondary-button" onClick={() => window.print()} type="button"><Printer size={16} />Imprimir / PDF</button></PageHeader>

      <section className="pro-selector panel multi no-print">
        <label>Artista<select value={artistId} onChange={(event) => setArtistId(event.target.value)}>{artists.map((item) => <option key={item.id} value={item.id}>{item.stageName}</option>)}</select></label>
        <label>Lancamento<select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>{artistReleases.map((item) => <option key={item.id} value={item.id}>{item.songTitle}</option>)}</select></label>
        <label>Tipo de relatorio<select value={type} onChange={(event) => setType(event.target.value)}>{reportTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="primary-button align-end" onClick={generate} type="button"><Sparkles size={16} />Gerar relatorio</button>
      </section>

      <section className="panel no-print"><div className="panel-heading"><h2>Observacoes manuais</h2><StatusBadge>opcional</StatusBadge></div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Conclusao, feedback do artista, aprendizados e proximos passos." /></section>

      {draft && <section className="panel pro-report print-card"><div className="report-cover-row"><CoverImage src={draft.snapshot?.cover} alt={draft.title} /><div><span className="eyebrow">Rascunho</span><h2>{draft.title}</h2><p>{draft.snapshot?.artistName} · {draft.snapshot?.releaseTitle}</p></div></div><textarea className="pro-document-editor" value={`${draft.content}\n\nOBSERVACOES\n${notes || 'Nao informado'}`} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value, updatedAt: new Date().toISOString() }))} rows={22} /><div className="pro-actions-row no-print"><button className="secondary-button" onClick={() => copyText(draft.content, () => setCopied(draft.id))} type="button"><Copy size={16} />{copied === draft.id ? 'Copiado' : 'Copiar'}</button><button className="primary-button" onClick={saveDraft} type="button"><Save size={16} />Salvar versao</button></div></section>}

      <section className="pro-stack no-print"><div className="section-title-row"><div><span className="eyebrow">Versoes salvas</span><h2>Historico de relatorios</h2></div><StatusBadge>{saved.length} versao(oes)</StatusBadge></div>{saved.map((item) => <article className="panel pro-document" key={item.id}><div className="panel-heading"><div><span className="eyebrow">{item.type}</span><h2>{item.title}</h2></div><button className="danger-button compact" onClick={() => onDeleteReport(item.id)} type="button"><Trash2 size={14} />Excluir</button></div><textarea className="pro-document-editor" value={item.content} onChange={(event) => onUpdateReport(item.id, { content: event.target.value, updatedAt: new Date().toISOString() })} rows={10} /><div className="pro-actions-row"><button className="secondary-button compact" onClick={() => copyText(item.content, () => setCopied(item.id))} type="button"><Copy size={14} />{copied === item.id ? 'Copiado' : 'Copiar'}</button><button className="secondary-button compact" onClick={() => window.print()} type="button"><Printer size={14} />Imprimir</button></div></article>)}{!saved.length && <EmptyState title="Nenhum relatorio salvo" text="Gere e salve uma versao para manter snapshot do momento." />}</section>
    </section>
  );
}
