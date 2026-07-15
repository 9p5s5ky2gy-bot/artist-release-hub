import {
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  Link2,
  ListChecks,
  Music2,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CoverImage } from '../components/CoverImage';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { diffInDays, formatFullDate, formatHumanDate, todayInput } from '../utils/date';
import { getReleaseProgress, getPlanPhase } from '../utils/calendar';
import { getPitchKey } from '../utils/pitching';
import { getReleaseCover, getReleaseType } from '../utils/release';

const essentialChecklist = [
  { id: 'cover', label: 'Capa pronta' },
  { id: 'distributed', label: 'Música distribuída' },
  { id: 'presave', label: 'Pré-save pronto' },
  { id: 'spotifyPitch', label: 'Pitch feito' },
  { id: 'artistViewBioLink', label: 'Link na bio atualizado' },
  { id: 'artistViewPostsPrepared', label: 'Posts preparados' },
  { id: 'clip', label: 'Clipe/visualizer pronto' },
  { id: 'artistViewStoriesDone', label: 'Stories do dia feitos' },
];

const pitchPriority = ['spotify', 'distributor', 'short'];

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeDate(value) {
  return cleanText(value) || '9999-12-31';
}

function getArtistImage(artist) {
  return artist?.profileImage || artist?.platformProfiles?.spotify?.image || '';
}

function getClosestRelease(releases) {
  if (!releases.length) return null;
  const today = todayInput();
  const future = releases
    .filter((release) => normalizeDate(release.releaseDate) >= today)
    .sort((a, b) => normalizeDate(a.releaseDate).localeCompare(normalizeDate(b.releaseDate)));

  if (future.length) return future[0];

  return [...releases].sort((a, b) => normalizeDate(b.releaseDate).localeCompare(normalizeDate(a.releaseDate)))[0];
}

function getReleaseDistance(release) {
  if (!release?.releaseDate) return 'Sem data definida';
  const diff = diffInDays(release.releaseDate, todayInput());
  if (diff === 0) return 'Lançamento hoje';
  if (diff > 0) return `Faltam ${diff} dias`;
  return `${Math.abs(diff)} dias após o lançamento`;
}

function getCurrentPhase(release, todayDay, releaseDays) {
  if (todayDay?.phase) return todayDay.phase;
  if (!releaseDays.length) return 'Sem estratégia';
  return getPlanPhase(diffInDays(todayInput(), release.releaseDate));
}

function extractDetail(description, label) {
  const text = cleanText(description);
  if (!text) return '';
  const pattern = new RegExp(`${label}:\\s*([^.]*(?:\\.(?!\\s*(Formato|Gancho|Momento|CTA|Dica curta|Objetivo|Métrica para observar):)[^.]*)*)`, 'i');
  const match = text.match(pattern);
  return cleanText(match?.[1] || '').replace(/\s+$/, '');
}

function getActionSummary(day) {
  const orientations = day?.orientations || [];
  const titles = orientations.map((item) => cleanText(item.title)).filter(Boolean);
  const firstDescription = orientations.map((item) => item.description).find(Boolean) || '';
  return {
    title: titles.join(' + ') || 'Sem ação definida',
    tip: extractDetail(firstDescription, 'Dica curta') || cleanText(orientations[0]?.note) || 'Execute com clareza e registre o resultado.',
    cta: extractDetail(firstDescription, 'CTA') || 'Salvar, comentar, compartilhar ou responder.',
    priority: orientations[0]?.priority || 'média',
    type: orientations[0]?.type || 'orientação',
  };
}

function getMainPitch(pitching, artistId, releaseId) {
  return [...(pitching || [])]
    .filter((pitch) => pitch.artistId === artistId && pitch.releaseId === releaseId && cleanText(pitch.text))
    .sort((a, b) => {
      const priorityA = pitchPriority.includes(a.type) ? pitchPriority.indexOf(a.type) : 99;
      const priorityB = pitchPriority.includes(b.type) ? pitchPriority.indexOf(b.type) : 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return cleanText(b.updatedAt || b.createdAt).localeCompare(cleanText(a.updatedAt || a.createdAt));
    })[0] || null;
}

function collectLinks(artist, release) {
  const links = [
    { label: 'Spotify do artista', url: artist?.spotify },
    { label: 'Instagram do artista', url: artist?.instagram },
    { label: 'TikTok do artista', url: artist?.tiktok },
    { label: 'YouTube do artista', url: artist?.youtube },
    { label: 'E-mail', url: artist?.email ? `mailto:${artist.email}` : '' },
    { label: 'Pré-save', url: release?.presaveLink },
    { label: 'Spotify do lançamento', url: release?.spotifyLink },
    { label: 'YouTube do lançamento', url: release?.youtubeLink },
    { label: 'TikTok do lançamento', url: release?.tiktokLink },
    { label: 'Instagram do lançamento', url: release?.instagramLink },
    { label: 'Drive / materiais', url: release?.driveLink },
    { label: 'Canva', url: release?.canvaLink },
  ];

  (release?.customLinks || []).forEach((link) => {
    links.push({ label: link.label || 'Link personalizado', url: link.url });
  });

  return links.filter((link) => cleanText(link.url));
}

function MiniMetric({ label, value }) {
  return (
    <div className="artist-view-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LinkCard({ link, onCopy, copied }) {
  return (
    <div className="artist-view-link-card">
      <div>
        <strong>{link.label}</strong>
        <span>{link.url}</span>
      </div>
      <div>
        <a className="icon-button" href={link.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${link.label}`}>
          <ExternalLink size={16} />
        </a>
        <button className="icon-button" type="button" onClick={() => onCopy(link.url, link.label)} aria-label={`Copiar ${link.label}`}>
          <Copy size={16} />
        </button>
      </div>
      {copied === link.label && <small>Copiado</small>}
    </div>
  );
}

export function ArtistViewPage({
  artists,
  releases,
  planDays,
  pitching,
  pitchChecklists,
  onSetDayCompleted,
  onSetPitchChecklist,
  onNavigate,
}) {
  const [selectedArtistId, setSelectedArtistId] = useState(artists[0]?.id || '');
  const artist = artists.find((item) => item.id === selectedArtistId) || null;
  const artistReleases = useMemo(
    () => releases.filter((release) => release.artistId === selectedArtistId),
    [releases, selectedArtistId],
  );
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!artists.length) {
      setSelectedArtistId('');
      return;
    }
    if (!artists.some((item) => item.id === selectedArtistId)) {
      setSelectedArtistId(artists[0].id);
    }
  }, [artists, selectedArtistId]);

  useEffect(() => {
    const currentIsValid = artistReleases.some((release) => release.id === selectedReleaseId);
    if (currentIsValid) return;
    setSelectedReleaseId(getClosestRelease(artistReleases)?.id || '');
  }, [artistReleases, selectedReleaseId]);

  const selectedRelease = artistReleases.find((release) => release.id === selectedReleaseId) || getClosestRelease(artistReleases);
  const releaseDays = planDays
    .filter((day) => day.releaseId === selectedRelease?.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const today = todayInput();
  const todayDay = releaseDays.find((day) => day.date === today);
  const upcomingDays = releaseDays.filter((day) => day.date > today).slice(0, 3);
  const progress = selectedRelease ? getReleaseProgress(selectedRelease.id, planDays) : { completedDays: 0, totalDays: 0, remainingDays: 0, percent: 0 };
  const overdueDays = releaseDays.filter((day) => day.date < today && !day.completed).length;
  const pitch = selectedRelease ? getMainPitch(pitching, selectedArtistId, selectedRelease.id) : null;
  const pitchKey = selectedRelease ? getPitchKey(selectedArtistId, selectedRelease.id) : '';
  const checklist = pitchChecklists[pitchKey] || {};
  const links = collectLinks(artist, selectedRelease);
  const currentPhase = selectedRelease ? getCurrentPhase(selectedRelease, todayDay, releaseDays) : '';
  const todayAction = getActionSummary(todayDay);

  async function copyText(value, id) {
    const text = cleanText(value);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(id);
    window.setTimeout(() => setCopied(''), 1300);
  }

  if (!artists.length) {
    return (
      <section className="page-content artist-view-page">
        <PageHeader eyebrow="Execução" title="Visão do Artista" />
        <EmptyState title="Cadastre um artista primeiro" text="Depois esta tela mostra o resumo, tarefas, links e pitch do artista." />
      </section>
    );
  }

  return (
    <section className="page-content artist-view-page">
      <PageHeader eyebrow="Execução" title="Visão do Artista">
        <button className="secondary-button" type="button" onClick={() => onNavigate('artists')}>
          <Music2 size={16} />
          <span>Editar artista</span>
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('reports')}>
          <Clipboard size={16} />
          <span>Gerar relatorio</span>
        </button>
      </PageHeader>

      <section className="artist-view-selector panel">
        <label>
          Selecionar artista
          <select value={selectedArtistId} onChange={(event) => setSelectedArtistId(event.target.value)}>
            {artists.map((item) => (
              <option key={item.id} value={item.id}>{item.stageName}</option>
            ))}
          </select>
        </label>
        {artistReleases.length > 1 && (
          <label>
            Lançamento
            <select value={selectedRelease?.id || ''} onChange={(event) => setSelectedReleaseId(event.target.value)}>
              {artistReleases.map((release) => (
                <option key={release.id} value={release.id}>{release.songTitle}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="artist-view-hero panel">
        <div className="artist-view-profile">
          <CoverImage src={getArtistImage(artist)} alt={artist?.stageName || 'Artista'} />
          <div>
            <span className="eyebrow">Resumo do artista</span>
            <h2>{artist?.stageName || 'Artista'}</h2>
            <p>{artist?.notes || 'Adicione observações no cadastro para orientar execução, estética e comunicação.'}</p>
            <div className="artist-view-tags">
              {artist?.genre && <StatusBadge tone="blue">{artist.genre}</StatusBadge>}
              {artist?.cityCountry && <StatusBadge tone="neutral">{artist.cityCountry}</StatusBadge>}
              {artist?.archetype && <StatusBadge tone="mint">{artist.archetype}</StatusBadge>}
            </div>
          </div>
        </div>
        <div className="artist-view-editorial">
          <strong>Linhas editoriais</strong>
          <p>{artist?.editorialLines || artist?.archetype || 'Nenhuma linha editorial cadastrada ainda.'}</p>
        </div>
      </section>

      {!selectedRelease && (
        <EmptyState title="Este artista ainda não tem lançamento cadastrado." text="Crie um lançamento para acompanhar tarefas, links, pitch e progresso por aqui." />
      )}

      {selectedRelease && (
        <>
          <section className="artist-view-release-grid">
            <article className="panel artist-view-release-card">
              <CoverImage src={getReleaseCover(selectedRelease)} alt={selectedRelease.songTitle} />
              <div>
                <span className="eyebrow">Lançamento em foco</span>
                <h2>{selectedRelease.songTitle}</h2>
                <p>{getReleaseDistance(selectedRelease)} · {formatFullDate(selectedRelease.releaseDate)}</p>
                <div className="artist-view-tags">
                  <StatusBadge>{getReleaseType(selectedRelease)}</StatusBadge>
                  <StatusBadge tone="blue">{currentPhase}</StatusBadge>
                  <StatusBadge tone="neutral">{selectedRelease.status || 'planejamento'}</StatusBadge>
                </div>
              </div>
            </article>

            <article className="panel artist-view-progress-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Progresso</span>
                  <h2>{progress.percent}% concluído</h2>
                </div>
                <Target size={22} />
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <div className="artist-view-metrics">
                <MiniMetric label="Feitas" value={progress.completedDays} />
                <MiniMetric label="Pendentes" value={progress.remainingDays} />
                <MiniMetric label="Atrasadas" value={overdueDays} />
              </div>
            </article>
          </section>

          {!releaseDays.length && (
            <EmptyState title="Este lançamento ainda não tem estratégia gerada." text="Gere a estratégia em Lançamentos ou Calendário para aparecerem ações nesta visão." />
          )}

          <section className="artist-view-today-grid">
            <article className="panel artist-view-today-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Tarefa de hoje</span>
                  <h2>{formatFullDate(today)}</h2>
                </div>
                <StatusBadge tone={todayDay?.completed ? 'mint' : 'neutral'}>{todayDay?.completed ? 'Feito' : 'Aberto'}</StatusBadge>
              </div>
              {todayDay ? (
                <>
                  <div className="artist-view-action">
                    <span>{todayDay.phase}</span>
                    <strong>{todayAction.title}</strong>
                    <p><b>Dica:</b> {todayAction.tip}</p>
                    <p><b>CTA:</b> {todayAction.cta}</p>
                    <div className="artist-view-tags">
                      <StatusBadge>{todayAction.priority}</StatusBadge>
                      <StatusBadge tone="blue">{todayAction.type}</StatusBadge>
                    </div>
                  </div>
                  <div className="artist-view-button-row">
                    <button className="primary-button" type="button" onClick={() => onSetDayCompleted(todayDay.releaseId, todayDay.date, true)}>
                      <CheckCircle2 size={16} />
                      <span>{todayDay.completed ? 'Dia já feito' : 'Marcar como feito'}</span>
                    </button>
                    <button className="secondary-button" type="button" onClick={() => onNavigate('tasks')}>
                      <CalendarDays size={16} />
                      <span>Abrir calendário completo</span>
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState title="Não há tarefa programada para hoje." text="Confira os próximos dias ou abra o calendário completo." action={
                  <button className="secondary-button" type="button" onClick={() => onNavigate('tasks')}>Abrir calendário completo</button>
                } />
              )}
            </article>

            <article className="panel artist-view-next-card">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Próximos 3 dias</span>
                  <h2>O que vem agora</h2>
                </div>
                <ListChecks size={22} />
              </div>
              <div className="artist-view-next-list">
                {upcomingDays.length ? upcomingDays.map((day) => {
                  const summary = getActionSummary(day);
                  return (
                    <div className="artist-view-next-item" key={day.key}>
                      <time>{formatHumanDate(day.date, { weekday: 'short' })}</time>
                      <div>
                        <strong>{summary.title}</strong>
                        <span>{day.phase} · CTA: {summary.cta}</span>
                      </div>
                      <StatusBadge tone={day.completed ? 'mint' : 'neutral'}>{day.completed ? 'Feito' : summary.priority}</StatusBadge>
                    </div>
                  );
                }) : <p className="muted">Nenhuma próxima tarefa encontrada para este lançamento.</p>}
              </div>
            </article>
          </section>

          <section className="artist-view-lower-grid">
            <article className="panel artist-view-links-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Links importantes</span>
                  <h2>Acesso rápido</h2>
                </div>
                <Link2 size={22} />
              </div>
              <div className="artist-view-links-list">
                {links.length ? links.map((link) => (
                  <LinkCard key={`${link.label}-${link.url}`} link={link} onCopy={copyText} copied={copied} />
                )) : <EmptyState title="Adicione links no cadastro do artista ou lançamento." />}
              </div>
            </article>

            <article className="panel artist-view-pitch-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Pitch principal</span>
                  <h2>{pitch?.title || 'Pitch ainda não gerado.'}</h2>
                </div>
                <Clipboard size={22} />
              </div>
              {pitch ? (
                <>
                  <p>{pitch.text}</p>
                  <div className="artist-view-button-row">
                    <button className="secondary-button" type="button" onClick={() => copyText(pitch.text, 'pitch')}>
                      <Copy size={16} />
                      <span>{copied === 'pitch' ? 'Copiado' : 'Copiar pitch'}</span>
                    </button>
                    <button className="primary-button" type="button" onClick={() => onNavigate('pitching')}>
                      <Clipboard size={16} />
                      <span>Abrir Pitching</span>
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState title="Pitch ainda não gerado." text="Gere e salve um pitch na aba Pitching para ele aparecer aqui." action={
                  <button className="secondary-button" type="button" onClick={() => onNavigate('pitching')}>Abrir Pitching</button>
                } />
              )}
            </article>

            <article className="panel artist-view-checklist-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Checklist essencial</span>
                  <h2>Pronto para executar</h2>
                </div>
                <ListChecks size={22} />
              </div>
              <div className="artist-view-checklist">
                {essentialChecklist.map((item) => (
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
        </>
      )}
    </section>
  );
}
