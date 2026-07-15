import { BarChart3, Copy, FileText, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { compareReleaseMetrics, formatCurrency, getReleaseMetrics, summarizeFinance } from '../utils/proModules';
import { getReleaseCover } from '../utils/release';
import { getReleaseProgress } from '../utils/calendar';

function copyComparison(rows, releases) {
  const text = rows.map((row) => `${row.label}: ${releases.map((release) => `${release.songTitle}: ${row.get(release)}`).join(' | ')}`).join('\n');
  navigator.clipboard?.writeText(text).catch(() => {});
}

export function ComparePage({ artists, releases, planDays, pitching, onNavigate }) {
  const [artistId, setArtistId] = useState('all');
  const available = useMemo(() => releases.filter((release) => artistId === 'all' || release.artistId === artistId), [releases, artistId]);
  const [selectedIds, setSelectedIds] = useState([]);
  const selected = selectedIds.map((id) => releases.find((release) => release.id === id)).filter(Boolean);
  const comparison = compareReleaseMetrics({ releases: selected, planDays, pitching });
  const history = [...available].sort((a, b) => String(b.releaseDate || '').localeCompare(String(a.releaseDate || '')));

  function toggleRelease(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 3 ? [current[1], current[2], id] : [...current, id]);
  }

  if (!releases.length) return <section className="page-content"><PageHeader eyebrow="Comparar" title="Historico e comparacao" /><EmptyState title="Nenhum lancamento cadastrado" text="Cadastre lancamentos para comparar historico, execucao e resultados." /></section>;

  return (
    <section className="page-content pro-page">
      <PageHeader eyebrow="Comparar" title="Historico e comparacao de lancamentos">
        <button className="secondary-button" onClick={() => copyComparison(comparison.rows, selected)} type="button"><Copy size={16} />Copiar comparacao</button>
        <button className="primary-button" onClick={() => onNavigate('reports')} type="button"><FileText size={16} />Abrir relatorios</button>
      </PageHeader>

      <section className="pro-selector panel">
        <label>Artista<select value={artistId} onChange={(event) => { setArtistId(event.target.value); setSelectedIds([]); }}><option value="all">Todos</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.stageName}</option>)}</select></label>
      </section>

      <section className="release-picker-grid">
        {available.map((release) => {
          const checked = selectedIds.includes(release.id);
          const progress = getReleaseProgress(release.id, planDays);
          return <button className={`release-pick-card ${checked ? 'active' : ''}`} key={release.id} onClick={() => toggleRelease(release.id)} type="button"><CoverImage src={getReleaseCover(release)} alt={release.songTitle} /><div><strong>{release.songTitle}</strong><span>{release.releaseDate || 'Sem data'} · {progress.totalDays ? `${progress.percent}%` : 'sem calendario'}</span></div></button>;
        })}
      </section>

      {selected.length >= 2 ? <section className="panel table-shell"><table className="pro-table"><thead><tr><th>Metrica</th>{selected.map((release) => <th key={release.id}>{release.songTitle}</th>)}<th>Diferenca</th></tr></thead><tbody>{comparison.rows.map((row) => <tr key={row.key}><td>{row.label}</td>{selected.map((release) => <td key={release.id}>{row.get(release)}</td>)}<td>{selected.length === 2 ? 'Compare contexto antes de concluir' : 'Multicomparacao'}</td></tr>)}</tbody></table></section> : <EmptyState title="Selecione 2 ou 3 lancamentos" text="O mesmo lancamento nao pode ser selecionado duas vezes." />}

      <section className="pro-grid two-columns">
        <article className="panel"><div className="panel-heading"><div><span className="eyebrow">Insights internos</span><h2>Leitura dos dados</h2></div><TrendingUp size={18} /></div><ul className="pro-list">{comparison.insights.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="panel"><div className="panel-heading"><div><span className="eyebrow">Historico</span><h2>Lancamentos do artista</h2></div><BarChart3 size={18} /></div><div className="pro-stack">{history.map((release) => { const progress = getReleaseProgress(release.id, planDays); const finance = summarizeFinance(release); const metrics = getReleaseMetrics(release); return <div className="history-row" key={release.id}><CoverImage src={getReleaseCover(release)} alt={release.songTitle} /><div><strong>{release.songTitle}</strong><span>{release.releaseDate || 'Sem data'} · {progress.totalDays ? `${progress.percent}% executado` : 'sem calendario'}</span><small>{finance.budget ? `Orcamento ${formatCurrency(finance.budget)}` : 'Orcamento nao informado'} · {metrics.streams ? `${metrics.streams} streams` : 'metricas sem dados'}</small></div><StatusBadge>{release.diagnosis?.score ? `${release.diagnosis.score}/100` : 'sem diagnostico'}</StatusBadge></div>; })}</div></article>
      </section>
    </section>
  );
}
