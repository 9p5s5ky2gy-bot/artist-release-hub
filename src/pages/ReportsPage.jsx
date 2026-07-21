import { CalendarDays, Copy, Disc3, Edit3, Eye, Printer, Save, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { generateClipBrandingReport, reportSectionsToText } from '../utils/clipBrandingReport';
import { createId } from '../utils/id';
import { getPitchKey } from '../utils/pitching';
import { generateReport, reportTypes } from '../utils/proModules';
import { getReleaseCover } from '../utils/release';

async function copyText(value, done) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  done();
}

export function ReportsPage({
  artists,
  releases,
  planDays,
  tasks,
  pitching,
  pitchBriefs,
  pitchChecklists,
  reports,
  onSaveReport,
  onDeleteReport,
  onNavigate,
}) {
  const [artistId, setArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(
    () => releases.filter((release) => !artistId || release.artistId === artistId),
    [releases, artistId],
  );
  const [releaseId, setReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [type, setType] = useState('complete');
  const [draft, setDraft] = useState(null);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState('');
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (artists.length && !artists.some((artist) => artist.id === artistId)) setArtistId(artists[0].id);
  }, [artists, artistId]);

  useEffect(() => {
    const available = releases.filter((release) => !artistId || release.artistId === artistId);
    if (available.length && !available.some((release) => release.id === releaseId)) setReleaseId(available[0].id);
  }, [releases, artistId, releaseId]);

  useEffect(() => {
    setDraft(null);
    setEditing(false);
    setDirty(false);
  }, [artistId, releaseId]);

  const artist = artists.find((item) => item.id === artistId) || {};
  const release = releases.find((item) => item.id === releaseId) || {};
  const saved = reports.filter((item) => item.artistId === artistId && item.releaseId === releaseId);

  function generate() {
    if (dirty && !window.confirm('Substituir o relatório editado por uma nova geração? A versão salva não será apagada.')) return;
    const generated = type === 'clip_branding'
      ? generateClipBrandingReport({
          artist,
          release,
          planDays,
          tasks,
          pitching,
          pitchBrief: pitchBriefs?.[getPitchKey(artistId, releaseId)] || {},
        })
      : generateReport({ type, artist, release, planDays, tasks, pitching, pitchBriefs, pitchChecklists });
    setDraft({
      ...generated,
      id: createId('report-draft'),
      artistId,
      releaseId,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
    setDirty(false);
  }

  function saveDraft() {
    if (!draft) return;
    onSaveReport({
      ...draft,
      id: createId('report'),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setDirty(false);
  }

  function updateSection(sectionId, content) {
    setDraft((current) => {
      const sections = current.sections.map((section) => (section.id === sectionId ? { ...section, content } : section));
      return {
        ...current,
        sections,
        content: reportSectionsToText(current.title, sections, current.summaryForFilmmaker),
        updatedAt: new Date().toISOString(),
      };
    });
    setDirty(true);
  }

  function updateSummary(summaryForFilmmaker) {
    setDraft((current) => ({
      ...current,
      summaryForFilmmaker,
      content: reportSectionsToText(current.title, current.sections, summaryForFilmmaker),
      updatedAt: new Date().toISOString(),
    }));
    setDirty(true);
  }

  function openSavedReport(report) {
    if (dirty && !window.confirm('Abrir a versão salva e descartar as alterações não salvas do rascunho?')) return;
    setType(report.type || 'complete');
    setDraft({ ...report });
    setNotes(report.notes || '');
    setEditing(false);
    setDirty(false);
  }

  function printReport() {
    setEditing(false);
    window.setTimeout(() => window.print(), 50);
  }

  if (!artists.length || !releases.length) {
    return (
      <section className="page-content">
        <PageHeader eyebrow="Relatórios" title="Relatórios de lançamento" />
        <EmptyState title="Cadastre artista e lançamento" text="Os relatórios usam estratégia, pitching, diagnóstico, financeiro e links." />
      </section>
    );
  }

  return (
    <section className="page-content pro-page reports-page">
      <PageHeader eyebrow="Relatórios" title="Relatórios completos do lançamento">
        <button className="secondary-button" onClick={printReport} type="button"><Printer size={16} />Imprimir / PDF</button>
      </PageHeader>

      <section className="pro-selector panel multi no-print">
        <label>Artista<select value={artistId} onChange={(event) => setArtistId(event.target.value)}>{artists.map((item) => <option key={item.id} value={item.id}>{item.stageName}</option>)}</select></label>
        <label>Lançamento<select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>{artistReleases.map((item) => <option key={item.id} value={item.id}>{item.songTitle}</option>)}</select></label>
        <label>Tipo de relatório<select value={type} onChange={(event) => setType(event.target.value)}>{reportTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="primary-button align-end" onClick={generate} type="button"><Sparkles size={16} />{type === 'clip_branding' ? 'Gerar branding para clipe' : 'Gerar relatório'}</button>
      </section>

      <section className="panel no-print">
        <div className="panel-heading"><h2>Observações manuais</h2><StatusBadge>opcional</StatusBadge></div>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Conclusão, feedback do artista, aprendizados e próximos passos." />
      </section>

      {draft && (
        <section className={`panel pro-report print-card ${draft.type === 'clip_branding' ? 'clip-branding-report' : ''}`}>
          <div className="report-cover-row">
            <CoverImage src={getReleaseCover(release) || draft.snapshot?.cover} alt={draft.title} />
            <div>
              <span className="eyebrow">{draft.type === 'clip_branding' ? 'Branding audiovisual' : 'Rascunho'}</span>
              <h2>{draft.title}</h2>
              <p>{draft.snapshot?.artistName} · {draft.snapshot?.releaseTitle}</p>
              {draft.type === 'clip_branding' && (
                <div className="clip-report-tags">
                  <StatusBadge>{draft.snapshot?.genre || 'Gênero não informado'}</StatusBadge>
                  <StatusBadge>{draft.snapshot?.mood || 'Mood não informado'}</StatusBadge>
                  <StatusBadge>{draft.snapshot?.archetypes || 'Arquétipo não informado'}</StatusBadge>
                </div>
              )}
            </div>
          </div>

          {draft.type === 'clip_branding' && Array.isArray(draft.sections) ? (
            <>
              <div className="clip-report-sections">
                {draft.sections.map((section) => (
                  <article className="clip-report-section" key={section.id}>
                    <h3>{section.title}</h3>
                    {editing ? (
                      <textarea value={section.content} onChange={(event) => updateSection(section.id, event.target.value)} rows={Math.min(16, Math.max(6, section.content.split('\n').length + 2))} />
                    ) : (
                      <div className="clip-report-copy">{section.content}</div>
                    )}
                  </article>
                ))}
              </div>
              <article className="clip-filmmaker-summary">
                <span className="eyebrow">Pronto para WhatsApp ou e-mail</span>
                <h3>17. Resumo para envio ao filmmaker</h3>
                {editing ? (
                  <textarea value={draft.summaryForFilmmaker || ''} onChange={(event) => updateSummary(event.target.value)} rows={12} />
                ) : (
                  <div className="clip-report-copy">{draft.summaryForFilmmaker}</div>
                )}
              </article>
            </>
          ) : (
            <textarea
              className="pro-document-editor"
              value={draft.content}
              onChange={(event) => {
                setDraft((current) => ({ ...current, content: event.target.value, updatedAt: new Date().toISOString() }));
                setDirty(true);
              }}
              rows={22}
            />
          )}

          <div className="pro-actions-row no-print clip-report-actions">
            <button className="secondary-button" onClick={() => copyText(draft.content, () => setCopied('full'))} type="button"><Copy size={16} />{copied === 'full' ? 'Relatório copiado' : 'Copiar relatório completo'}</button>
            {draft.summaryForFilmmaker && <button className="secondary-button" onClick={() => copyText(draft.summaryForFilmmaker, () => setCopied('summary'))} type="button"><Copy size={16} />{copied === 'summary' ? 'Resumo copiado' : 'Copiar resumo para filmmaker'}</button>}
            {draft.type === 'clip_branding' && <button className="secondary-button" onClick={() => setEditing((value) => !value)} type="button"><Edit3 size={16} />{editing ? 'Concluir edição' : 'Editar relatório'}</button>}
            <button className="primary-button" onClick={saveDraft} type="button"><Save size={16} />Salvar versão</button>
            <button className="secondary-button" onClick={printReport} type="button"><Printer size={16} />Imprimir / salvar PDF</button>
            <button className="secondary-button" onClick={() => onNavigate?.('releases')} type="button"><Disc3 size={16} />Abrir lançamento</button>
            <button className="secondary-button" onClick={() => onNavigate?.('pitching')} type="button"><Send size={16} />Abrir Pitching</button>
            <button className="secondary-button" onClick={() => onNavigate?.('calendar')} type="button"><CalendarDays size={16} />Abrir estratégia</button>
          </div>
        </section>
      )}

      <section className="pro-stack no-print">
        <div className="section-title-row"><div><span className="eyebrow">Versões salvas</span><h2>Histórico de relatórios</h2></div><StatusBadge>{saved.length} versão(ões)</StatusBadge></div>
        {saved.map((item) => (
          <article className="panel pro-document" key={item.id}>
            <div className="panel-heading">
              <div><span className="eyebrow">{item.type === 'clip_branding' ? 'Branding do clipe' : item.type}</span><h2>{item.title}</h2></div>
              <button className="danger-button compact" onClick={() => onDeleteReport(item.id)} type="button"><Trash2 size={14} />Excluir</button>
            </div>
            <p className="muted-copy">Salvo em {new Date(item.updatedAt || item.createdAt).toLocaleString('pt-BR')}</p>
            <div className="pro-actions-row">
              <button className="secondary-button compact" onClick={() => openSavedReport(item)} type="button"><Eye size={14} />Abrir versão</button>
              <button className="secondary-button compact" onClick={() => copyText(item.content, () => setCopied(item.id))} type="button"><Copy size={14} />{copied === item.id ? 'Copiado' : 'Copiar'}</button>
              <button className="secondary-button compact" onClick={printReport} type="button"><Printer size={14} />Imprimir</button>
            </div>
          </article>
        ))}
        {!saved.length && <EmptyState title="Nenhum relatório salvo" text="Gere e salve uma versão para manter o snapshot do momento." />}
      </section>
    </section>
  );
}
