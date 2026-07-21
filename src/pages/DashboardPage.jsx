import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Disc3,
  ListChecks,
  Mic2,
  Sparkles,
  Target,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { CoverImage } from '../components/CoverImage';
import { diffInDays, formatFullDate, formatHumanDate, todayInput } from '../utils/date';
import { getReleaseProgress } from '../utils/calendar';
import { getReleaseCover } from '../utils/release';

export function DashboardPage({ artists, releases, planDays, onNavigate }) {
  const today = todayInput();
  const activeReleases = releases.filter((release) => release.status !== 'finalizado');
  const finishedReleases = releases.filter((release) => release.status === 'finalizado');
  const completedDays = planDays.filter((day) => day.completed);
  const openDays = planDays.filter((day) => !day.completed);
  const todayDays = openDays.filter((day) => day.date === today);
  const overdueDays = openDays.filter((day) => day.date < today);
  const completionRate = planDays.length ? Math.round((completedDays.length / planDays.length) * 100) : 0;
  const upcomingReleases = activeReleases
    .filter((release) => release.releaseDate >= today)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
    .slice(0, 4);
  const nextRelease = upcomingReleases[0];
  const nextReleaseArtist = nextRelease ? artists.find((item) => item.id === nextRelease.artistId) : null;
  const nextReleaseProgress = nextRelease ? getReleaseProgress(nextRelease.id, planDays) : { completedDays: 0, totalDays: 0, percent: 0 };
  const nextReleaseDistance = nextRelease ? diffInDays(nextRelease.releaseDate, today) : null;
  const nextOpenDays = openDays
    .filter((day) => day.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const stats = [
    { label: 'Artistas cadastrados', value: artists.length, icon: Mic2, tone: 'mint', meta: 'catálogo' },
    { label: 'Lançamentos ativos', value: activeReleases.length, icon: Disc3, tone: 'blue', meta: 'campanhas' },
    { label: 'Dias planejados', value: planDays.length, icon: CalendarCheck, tone: 'yellow', meta: 'máx. 31' },
    { label: 'Dias em aberto', value: openDays.length, icon: ListChecks, tone: 'coral', meta: `${completionRate}% feito` },
    { label: 'Dias de hoje', value: todayDays.length, icon: Clock3, tone: 'mint', meta: 'agenda' },
    { label: 'Dias atrasados', value: overdueDays.length, icon: AlertTriangle, tone: 'red', meta: 'atenção' },
    { label: 'Finalizados', value: finishedReleases.length, icon: CheckCircle2, tone: 'neutral', meta: 'arquivo' },
  ];

  return (
    <section className="page-content dashboard-page">
      <PageHeader eyebrow="Visão geral" title="Dashboard">
        <button className="secondary-button" onClick={() => onNavigate('tasks')} type="button">
          <ListChecks size={16} />
          <span>Dias do plano</span>
        </button>
        <button className="primary-button" onClick={() => onNavigate('releases')} type="button">
          <Disc3 size={16} />
          <span>Novo lançamento</span>
        </button>
      </PageHeader>

      <section className="command-panel">
        <div className="command-copy">
          <span className="eyebrow">Central de campanha</span>
          <h2>{nextRelease ? `${nextRelease.songTitle} está em movimento` : 'Planeje a próxima era'}</h2>
          <p>
            {nextRelease
              ? `${nextReleaseArtist?.stageName || 'Artista'} tem lançamento em ${nextReleaseDistance} dia(s), com ${nextReleaseProgress.completedDays} de ${nextReleaseProgress.totalDays} dias concluídos.`
              : 'Cadastre um lançamento para gerar automaticamente a agenda de pré-save, conteúdo e pós-lançamento.'}
          </p>
          <div className="command-actions">
            <button className="primary-button" onClick={() => onNavigate(nextRelease ? 'calendar' : 'releases')} type="button">
              <CalendarCheck size={16} />
              <span>{nextRelease ? 'Abrir calendário' : 'Criar campanha'}</span>
            </button>
            <button className="secondary-button" onClick={() => onNavigate('links')} type="button">
              <ArrowRight size={16} />
              <span>Central de links</span>
            </button>
          </div>
        </div>

        <div className="command-release">
          {nextRelease ? (
            <>
              <CoverImage src={getReleaseCover(nextRelease)} alt={nextRelease.songTitle} />
              <div>
                <StatusBadge>{nextRelease.status}</StatusBadge>
                <strong>{formatFullDate(nextRelease.releaseDate)}</strong>
                <span>{nextReleaseArtist?.stageName || 'Artista removido'}</span>
              </div>
              <div className="progress-block compact-progress">
                <div>
                  <span>{nextReleaseProgress.completedDays}/{nextReleaseProgress.totalDays} dias concluídos</span>
                  <strong>{nextReleaseProgress.percent}%</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${nextReleaseProgress.percent}%` }} />
                </div>
              </div>
            </>
          ) : (
            <div className="command-empty">
              <Sparkles size={26} />
              <strong>Sem campanha futura</strong>
              <span>O próximo lançamento aparece aqui.</span>
            </div>
          )}
        </div>
      </section>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Agenda</span>
              <h2>Próximos lançamentos</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate('calendar')} type="button">Ver calendário</button>
          </div>
          {upcomingReleases.length ? (
            <div className="release-strip">
              {upcomingReleases.map((release) => {
                const artist = artists.find((item) => item.id === release.artistId);
                const progress = getReleaseProgress(release.id, planDays);
                return (
                  <article className="release-mini" key={release.id}>
                    <CoverImage src={getReleaseCover(release)} alt={release.songTitle} />
                    <div className="release-mini-copy">
                      <strong className="release-mini-title">{release.songTitle}</strong>
                      <span className="release-mini-artist">{artist?.stageName || 'Artista removido'}</span>
                      <div className="release-mini-meta">
                        <time dateTime={release.releaseDate}>{formatFullDate(release.releaseDate)}</time>
                        <span>{progress.completedDays}/{progress.totalDays} dias concluídos</span>
                      </div>
                    </div>
                    <StatusBadge>{release.status || 'planejamento'}</StatusBadge>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhum lançamento futuro"
              text="Cadastre um lançamento para criar o calendário automaticamente."
              action={<button className="secondary-button" onClick={() => onNavigate('releases')} type="button">Cadastrar</button>}
            />
          )}
        </section>

        <section className="panel signal-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Hoje</span>
              <h2>Dias para concluir</h2>
            </div>
            <StatusBadge tone="mint">{todayDays.length}</StatusBadge>
          </div>
          <div className="task-stack">
            {todayDays.slice(0, 5).map((day) => (
              <div className="task-snippet" key={day.key}>
                <CalendarCheck size={15} />
                <div>
                  <strong>Dia {day.dayNumber} · {day.release.songTitle}</strong>
                  <span>{day.phase} · {day.orientations.length} orientações</span>
                </div>
              </div>
            ))}
            {!todayDays.length && <EmptyState title="Sem dias abertos hoje" />}
          </div>
        </section>

        <section className="panel signal-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Risco</span>
              <h2>Dias atrasados</h2>
            </div>
            <StatusBadge tone="red">{overdueDays.length}</StatusBadge>
          </div>
          <div className="task-stack">
            {overdueDays.slice(0, 5).map((day) => (
              <div className="task-snippet urgent" key={day.key}>
                <Target size={15} />
                <div>
                  <strong>Dia {day.dayNumber} · {day.release.songTitle}</strong>
                  <span>{formatHumanDate(day.date)} · {day.phase}</span>
                </div>
              </div>
            ))}
            {!overdueDays.length && <EmptyState title="Nada atrasado" />}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Execução</span>
              <h2>Próximos dias abertos</h2>
            </div>
            <button className="text-button" onClick={() => onNavigate('tasks')} type="button">Abrir checklist</button>
          </div>
          <div className="compact-task-list">
            {nextOpenDays.map((day) => (
              <div key={day.key} className="compact-task">
                <div>
                  <strong>Dia {day.dayNumber} · {day.release.songTitle}</strong>
                  <span>{day.artist?.stageName || 'Artista'} · {day.relation}</span>
                </div>
                <StatusBadge>{day.phase}</StatusBadge>
                <time>{formatHumanDate(day.date)}</time>
              </div>
            ))}
            {!nextOpenDays.length && <EmptyState title="Sem próximos dias em aberto" />}
          </div>
        </section>
      </div>
    </section>
  );
}
