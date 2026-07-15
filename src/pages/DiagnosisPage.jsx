import { Activity, AlertTriangle, CheckCircle2, FileText, RefreshCcw, Save, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { analyzeRelease, buildDiagnosisSnapshot, formatCurrency } from '../utils/proModules';

const categoryLabels = {
  basics: 'Cadastro e informacoes basicas',
  strategy: 'Estrategia',
  content: 'Conteudo',
  pitching: 'Pitching',
  distribution: 'Distribuicao e preparacao',
  engagement: 'Engajamento e superfas',
  links: 'Links e materiais',
  execution: 'Execucao',
  postlaunch: 'Pos-lancamento',
  budget: 'Orcamento e recursos',
};

function ReleaseSelectors({ artists, releases, artistId, releaseId, onArtist, onRelease }) {
  const artistReleases = releases.filter((release) => !artistId || release.artistId === artistId);
  return (
    <section className="pro-selector panel">
      <label>
        Artista
        <select value={artistId} onChange={(event) => onArtist(event.target.value)}>
          {artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.stageName}</option>)}
        </select>
      </label>
      <label>
        Lancamento
        <select value={releaseId} onChange={(event) => onRelease(event.target.value)}>
          {artistReleases.map((release) => <option key={release.id} value={release.id}>{release.songTitle}</option>)}
        </select>
      </label>
    </section>
  );
}

export function DiagnosisPage({ artists, releases, tasks, planDays, pitching, pitchChecklists, onPatchRelease, onNavigate }) {
  const [artistId, setArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(() => releases.filter((release) => !artistId || release.artistId === artistId), [releases, artistId]);
  const [releaseId, setReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (artists.length && !artists.some((artist) => artist.id === artistId)) setArtistId(artists[0].id);
  }, [artists, artistId]);

  useEffect(() => {
    const available = releases.filter((release) => !artistId || release.artistId === artistId);
    if (available.length && !available.some((release) => release.id === releaseId)) setReleaseId(available[0].id);
  }, [releases, artistId, releaseId]);

  const artist = artists.find((item) => item.id === artistId) || {};
  const release = releases.find((item) => item.id === releaseId) || {};
  const diagnosis = useMemo(() => analyzeRelease({ artist, release, planDays, tasks, pitching, pitchChecklists }), [artist, release, planDays, tasks, pitching, pitchChecklists, refreshKey]);

  function saveDiagnosis() {
    if (!release.id) return;
    onPatchRelease(release.id, { diagnosis: buildDiagnosisSnapshot(diagnosis) });
  }

  if (!artists.length || !releases.length) {
    return <section className="page-content"><PageHeader eyebrow="Diagnostico" title="Saude do lancamento" /><EmptyState title="Cadastre artista e lancamento" text="O diagnostico usa dados reais do calendario, pitching, links e financeiro." /></section>;
  }

  return (
    <section className="page-content pro-page">
      <PageHeader eyebrow="Diagnostico" title="Saude do lancamento">
        <button className="secondary-button" onClick={() => setRefreshKey((value) => value + 1)} type="button"><RefreshCcw size={16} /><span>Atualizar diagnostico</span></button>
        <button className="primary-button" onClick={saveDiagnosis} type="button"><Save size={16} /><span>Salvar analise</span></button>
      </PageHeader>

      <ReleaseSelectors artists={artists} releases={releases} artistId={artistId} releaseId={releaseId} onArtist={setArtistId} onRelease={setReleaseId} />

      <div className="stats-grid">
        <StatCard label="Saude do lancamento" value={`${diagnosis.score}/100`} icon={Activity} tone="mint" />
        <StatCard label="Status" value={diagnosis.status} icon={Target} tone="blue" />
        <StatCard label="Dias concluidos" value={`${diagnosis.completedItems}/${diagnosis.progress.totalDays}`} icon={CheckCircle2} tone="yellow" />
        <StatCard label="Atrasados" value={diagnosis.overdueDays} icon={AlertTriangle} tone={diagnosis.overdueDays ? 'coral' : 'mint'} />
      </div>

      <section className="pro-grid two-columns">
        <article className="panel pro-score-panel">
          <div className="panel-heading"><div><span className="eyebrow">Nota geral</span><h2>{diagnosis.status}</h2></div><StatusBadge tone="mint">{diagnosis.score}/100</StatusBadge></div>
          <div className="progress-track"><span style={{ width: `${diagnosis.score}%` }} /></div>
          <p className="muted-copy">Financeiro: {diagnosis.finance.budget ? formatCurrency(diagnosis.finance.budget) : 'orcamento nao definido'}.</p>
          <div className="pro-actions-row">
            <button className="secondary-button compact" onClick={() => onNavigate('releases')} type="button">Abrir lancamento</button>
            <button className="secondary-button compact" onClick={() => onNavigate('calendar')} type="button">Abrir estrategia</button>
            <button className="secondary-button compact" onClick={() => onNavigate('pitching')} type="button">Abrir Pitching</button>
            <button className="secondary-button compact" onClick={() => onNavigate('finance')} type="button">Abrir financeiro</button>
            <button className="primary-button compact" onClick={() => onNavigate('reports')} type="button"><FileText size={14} />Gerar relatorio</button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Categorias</span><h2>Notas analisadas</h2></div></div>
          <div className="pro-category-list">
            {Object.entries(diagnosis.categoryScores).map(([key, value]) => (
              <div className="pro-category-row" key={key}>
                <span>{categoryLabels[key] || key}</span><strong>{value}/100</strong><div className="progress-track"><span style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="pro-grid three-columns">
        <article className="panel"><div className="panel-heading"><h2>Pontos fortes</h2></div><ul className="pro-list">{diagnosis.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="panel"><div className="panel-heading"><h2>Pontos de atencao</h2></div><ul className="pro-list warning">{diagnosis.warnings.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="panel"><div className="panel-heading"><h2>Proximas acoes</h2></div><div className="pro-stack">{diagnosis.priorities.map((item) => <div className="pro-mini-card" key={item.title}><strong>{item.title}</strong><span>{item.reason}</span><small>Impacto: {item.impact}</small><StatusBadge>{item.priority}</StatusBadge><button className="secondary-button compact" onClick={() => onNavigate(item.target)} type="button">Abrir area</button></div>)}</div></article>
      </section>
    </section>
  );
}
