import { Activity, AlertTriangle, CalendarClock, CheckCircle2, FileText, Instagram, MessageCircle, Music2, RefreshCcw, Save, Settings2, Target, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { buildContentProductionSummary } from '../utils/contentProduction';
import { deadlineDefinitions } from '../utils/deadlines';
import { formatFullDate } from '../utils/date';
import { analyzeRelease, buildDiagnosisSnapshot, formatCurrency } from '../utils/proModules';

const categoryLabels = {
  basics: 'Cadastro e informações básicas',
  strategy: 'Estratégia',
  content: 'Conteúdo',
  pitching: 'Pitching',
  distribution: 'Distribuição e preparação',
  engagement: 'Engajamento e superfãs',
  links: 'Links e materiais',
  execution: 'Execução',
  postlaunch: 'Pós-lançamento',
  budget: 'Orçamento e recursos',
};

const deadlineGroups = [
  { id: 'overdue', title: 'Urgente' },
  { id: 'attention', title: 'Atenção' },
  { id: 'on_track', title: 'Em dia' },
  { id: 'done', title: 'Concluído' },
  { id: 'not_applicable', title: 'Não se aplica' },
  { id: 'no_date', title: 'Data pendente' },
];

const productionIcons = {
  videos: Video,
  reels: Instagram,
  tiktoks: Music2,
  stories: MessageCircle,
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
        Lançamento
        <select value={releaseId} onChange={(event) => onRelease(event.target.value)}>
          {artistReleases.map((release) => <option key={release.id} value={release.id}>{release.songTitle}</option>)}
        </select>
      </label>
    </section>
  );
}

export function DiagnosisPage({ artists, releases, tasks, planDays, pitching, pitchBriefs, pitchChecklists, onPatchRelease, onNavigate }) {
  const [artistId, setArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(() => releases.filter((release) => !artistId || release.artistId === artistId), [releases, artistId]);
  const [releaseId, setReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({});
  const [productionView, setProductionView] = useState('summary');

  useEffect(() => {
    if (artists.length && !artists.some((artist) => artist.id === artistId)) setArtistId(artists[0].id);
  }, [artists, artistId]);

  useEffect(() => {
    const available = releases.filter((release) => !artistId || release.artistId === artistId);
    if (available.length && !available.some((release) => release.id === releaseId)) setReleaseId(available[0].id);
  }, [releases, artistId, releaseId]);

  const artist = artists.find((item) => item.id === artistId) || {};
  const release = releases.find((item) => item.id === releaseId) || {};
  const diagnosis = useMemo(
    () => analyzeRelease({ artist, release, planDays, tasks, pitching, pitchBriefs, pitchChecklists }),
    [artist, release, planDays, tasks, pitching, pitchBriefs, pitchChecklists, refreshKey],
  );
  const productionSummary = useMemo(
    () => buildContentProductionSummary({ releaseId, planDays, tasks }),
    [releaseId, planDays, tasks],
  );

  useEffect(() => {
    setSettingsDraft(diagnosis.deadlines?.settings || {});
  }, [release.id, diagnosis.deadlines?.settings]);

  function saveDiagnosis() {
    if (!release.id) return;
    onPatchRelease(release.id, { diagnosis: buildDiagnosisSnapshot(diagnosis) });
  }

  function setDeadlineStatus(alertId, status) {
    if (!release.id) return;
    onPatchRelease(release.id, {
      deadlineChecklist: {
        ...(release.deadlineChecklist || {}),
        [alertId]: { status, updatedAt: new Date().toISOString() },
      },
    });
  }

  function saveDeadlineSettings() {
    if (!release.id) return;
    const settings = Object.fromEntries(deadlineDefinitions.map((definition) => {
      const value = Number(settingsDraft[definition.id]);
      return [definition.id, Number.isFinite(value) ? Math.min(180, Math.max(0, Math.round(value))) : definition.defaultDays];
    }));
    onPatchRelease(release.id, { deadlineSettings: settings });
    setShowSettings(false);
  }

  if (!artists.length || !releases.length) {
    return <section className="page-content"><PageHeader eyebrow="Diagnóstico" title="Saúde do lançamento" /><EmptyState title="Cadastre artista e lançamento" text="O diagnóstico usa dados reais do calendário, pitching, links e financeiro." /></section>;
  }

  const deadlineData = diagnosis.deadlines;
  const mainAlertTone = deadlineData?.counts?.overdue ? 'is-urgent' : deadlineData?.counts?.attention ? 'is-attention' : 'is-ok';

  return (
    <section className="page-content pro-page diagnosis-page">
      <PageHeader eyebrow="Diagnóstico" title="Saúde do lançamento">
        <button className="secondary-button" onClick={() => setRefreshKey((value) => value + 1)} type="button"><RefreshCcw size={16} /><span>Atualizar diagnóstico</span></button>
        <button className="primary-button" onClick={saveDiagnosis} type="button"><Save size={16} /><span>Salvar análise</span></button>
      </PageHeader>

      <ReleaseSelectors artists={artists} releases={releases} artistId={artistId} releaseId={releaseId} onArtist={setArtistId} onRelease={setReleaseId} />

      {deadlineData && (
        <section className={`deadline-main-alert ${mainAlertTone}`}>
          <CalendarClock size={23} />
          <div><span className="eyebrow">Prazo mais importante agora</span><strong>{deadlineData.mainAlert}</strong></div>
        </section>
      )}

      <div className="stats-grid">
        <StatCard label="Saúde do lançamento" value={`${diagnosis.score}/100`} icon={Activity} tone="mint" />
        <StatCard label="Status" value={diagnosis.status} icon={Target} tone="blue" />
        <StatCard label="Dias concluídos" value={`${diagnosis.completedItems}/${diagnosis.progress.totalDays}`} icon={CheckCircle2} tone="yellow" />
        <StatCard label="Prazos atrasados" value={deadlineData?.counts?.overdue || 0} icon={AlertTriangle} tone={deadlineData?.counts?.overdue ? 'coral' : 'mint'} />
      </div>

      <section className="panel content-production-section">
        <div className="section-title-row">
          <div><span className="eyebrow">Plano de gravação</span><h2>Conteúdos do cronograma</h2></div>
          <StatusBadge>{productionSummary.total} gravação(ões)</StatusBadge>
        </div>

        <div className="content-production-tabs" role="tablist" aria-label="Visualização dos conteúdos do cronograma">
          <button className={productionView === 'summary' ? 'active' : ''} onClick={() => setProductionView('summary')} role="tab" aria-selected={productionView === 'summary'} type="button">Resumo</button>
          <button className={productionView === 'themes' ? 'active' : ''} onClick={() => setProductionView('themes')} role="tab" aria-selected={productionView === 'themes'} type="button">Temas das gravações</button>
        </div>

        {productionView === 'summary' ? (
          <div className="content-production-summary">
            {productionSummary.formats.map((format) => {
              const Icon = productionIcons[format.id];
              return <article className="content-production-stat" key={format.id}><div><Icon size={19} /></div><strong>{format.count}</strong><span>{format.label}</span></article>;
            })}
          </div>
        ) : (
          <div className="content-production-themes">
            {productionSummary.formats.filter((format) => format.count > 0).map((format) => (
              <article className="content-theme-group" key={format.id}>
                <div className="content-theme-heading"><h3>{format.label}</h3><StatusBadge>{format.count}</StatusBadge></div>
                <ol>{format.themes.map((theme, index) => <li key={`${theme.id}:${index}`}>{theme.title}</li>)}</ol>
              </article>
            ))}
            {!productionSummary.total && <div className="content-production-empty">Este cronograma ainda não possui temas de gravação.</div>}
          </div>
        )}
      </section>

      <section className="deadline-section">
        <div className="section-title-row">
          <div><span className="eyebrow">Planejamento estratégico</span><h2>Prazos críticos do lançamento</h2><p>Datas calculadas automaticamente a partir do dia do lançamento.</p></div>
          <button className="secondary-button no-print" onClick={() => setShowSettings((value) => !value)} type="button"><Settings2 size={16} />Configurar prazos</button>
        </div>

        {showSettings && (
          <section className="panel deadline-settings no-print">
            <div className="panel-heading"><div><span className="eyebrow">Dias antes do lançamento</span><h2>Configuração deste lançamento</h2></div></div>
            <div className="deadline-settings-grid">
              {deadlineDefinitions.map((definition) => (
                <label key={definition.id}>{definition.label}<input min="0" max="180" type="number" value={settingsDraft[definition.id] ?? definition.defaultDays} onChange={(event) => setSettingsDraft((current) => ({ ...current, [definition.id]: event.target.value }))} /></label>
              ))}
            </div>
            <div className="pro-actions-row"><button className="primary-button" onClick={saveDeadlineSettings} type="button"><Save size={16} />Salvar prazos</button><button className="secondary-button" onClick={() => setShowSettings(false)} type="button">Cancelar</button></div>
          </section>
        )}

        {!deadlineData?.hasDate && <div className="deadline-no-date"><AlertTriangle size={18} />Defina a data do lançamento para calcular os prazos.</div>}

        {deadlineGroups.map((group) => {
          const groupAlerts = deadlineData?.alerts?.filter((alert) => alert.status === group.id) || [];
          if (!groupAlerts.length) return null;
          return (
            <section className="deadline-group" key={group.id}>
              <div className="deadline-group-title"><h3>{group.title}</h3><StatusBadge>{groupAlerts.length}</StatusBadge></div>
              <div className="deadline-grid">
                {groupAlerts.map((alert) => (
                  <article className={`deadline-card status-${alert.status}`} key={alert.id}>
                    <div className="deadline-card-heading"><div className="deadline-icon"><CalendarClock size={18} /></div><div><h3>{alert.label}</h3><span>{alert.daysBefore} dias antes do lançamento</span></div><StatusBadge>{alert.statusLabel}</StatusBadge></div>
                    <div className="deadline-date-row"><span>Data limite</span><strong>{alert.dueDate ? formatFullDate(alert.dueDate) : 'Não calculada'}</strong></div>
                    <strong className="deadline-countdown">{alert.daysLabel}</strong>
                    <p>{alert.action}</p>
                    <small>{alert.detected ? 'Conclusão detectada automaticamente pelos dados do painel.' : alert.manualStatus === 'done' ? 'Concluído manualmente.' : 'Conclusão ainda não informada.'}</small>
                    <div className="deadline-card-actions no-print">
                      <label>Status manual<select value={alert.manualStatus} onChange={(event) => setDeadlineStatus(alert.id, event.target.value)}><option value="pending">Automático / pendente</option><option value="done">Concluído</option><option value="not_applicable">Não se aplica</option></select></label>
                      <button className="secondary-button" onClick={() => onNavigate(alert.target)} type="button">Abrir área</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <section className="pro-grid two-columns">
        <article className="panel pro-score-panel">
          <div className="panel-heading"><div><span className="eyebrow">Nota geral</span><h2>{diagnosis.status}</h2></div><StatusBadge tone="mint">{diagnosis.score}/100</StatusBadge></div>
          <div className="progress-track"><span style={{ width: `${diagnosis.score}%` }} /></div>
          <p className="muted-copy">Financeiro: {diagnosis.finance.budget ? formatCurrency(diagnosis.finance.budget) : 'orçamento não definido'}.</p>
          <div className="pro-actions-row">
            <button className="secondary-button compact" onClick={() => onNavigate('releases')} type="button">Abrir lançamento</button>
            <button className="secondary-button compact" onClick={() => onNavigate('calendar')} type="button">Abrir estratégia</button>
            <button className="secondary-button compact" onClick={() => onNavigate('pitching')} type="button">Abrir Pitching</button>
            <button className="secondary-button compact" onClick={() => onNavigate('finance')} type="button">Abrir financeiro</button>
            <button className="primary-button compact" onClick={() => onNavigate('reports')} type="button"><FileText size={14} />Gerar relatório</button>
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
        <article className="panel"><div className="panel-heading"><h2>Pontos de atenção</h2></div><ul className="pro-list warning">{diagnosis.warnings.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="panel"><div className="panel-heading"><h2>Próximas ações</h2></div><div className="pro-stack">{diagnosis.priorities.map((item) => <div className="pro-mini-card" key={item.title}><strong>{item.title}</strong><span>{item.reason}</span><small>Impacto: {item.impact}</small><StatusBadge>{item.priority}</StatusBadge><button className="secondary-button compact" onClick={() => onNavigate(item.target)} type="button">Abrir área</button></div>)}</div></article>
      </section>
    </section>
  );
}
