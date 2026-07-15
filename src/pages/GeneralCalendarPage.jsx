import { CalendarDays, CheckCircle2, Clock, Edit3, Eye, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { addDays, formatDateInput, formatFullDate, todayInput } from '../utils/date';
import { buildGlobalEvents, getArtistColor } from '../utils/proModules';

function byDate(events) {
  return events.reduce((groups, event) => {
    const key = event.date || 'sem-data';
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
    return groups;
  }, {});
}

function EventCard({ event, artistIndex, onOpen, onComplete }) {
  const color = getArtistColor(artistIndex);
  return (
    <article className={`global-event-card ${event.completed ? 'is-done' : ''}`} style={{ '--artist-color': color }}>
      <div className="global-event-main">
        <span className="artist-dot" />
        <div>
          <strong>{event.title}</strong>
          <span>{event.artist?.stageName || 'Artista'} · {event.release?.songTitle || 'Lancamento'}</span>
          <small>{event.phase || event.type} · {formatFullDate(event.date)}</small>
        </div>
      </div>
      <div className="global-event-actions">
        <StatusBadge>{event.priority || event.status}</StatusBadge>
        {event.kind === 'task' && <button className="secondary-button compact" onClick={() => onComplete(event)} type="button"><CheckCircle2 size={14} />Concluir dia</button>}
        <button className="secondary-button compact" onClick={() => onOpen(event)} type="button"><Eye size={14} />Detalhes</button>
      </div>
    </article>
  );
}

export function GeneralCalendarPage({ artists, releases, planDays, pitching, pitchChecklists, onSetDayCompleted, onUpdateOrientation, onRegenerateOrientation, onNavigate }) {
  const [view, setView] = useState('today');
  const [artistId, setArtistId] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const today = todayInput();
  const weekEnd = formatDateInput(addDays(today, 7));
  const events = useMemo(() => buildGlobalEvents({ artists, releases, planDays, pitching, pitchChecklists }), [artists, releases, planDays, pitching, pitchChecklists]);
  const filteredEvents = events.filter((event) => {
    if (artistId !== 'all' && event.artistId !== artistId) return false;
    if (status === 'done' && !event.completed) return false;
    if (status === 'pending' && event.completed) return false;
    if (status === 'late' && !(event.date < today && !event.completed)) return false;
    if (priority !== 'all' && event.priority !== priority) return false;
    if (view === 'today' && event.date !== today) return false;
    if (view === 'week' && !(event.date >= today && event.date <= weekEnd)) return false;
    return true;
  });
  const grouped = byDate(filteredEvents);
  const artistIndex = new Map(artists.map((artist, index) => [artist.id, index]));
  const monthDates = Array.from(new Set(events.filter((event) => event.date?.slice(0, 7) === today.slice(0, 7)).map((event) => event.date))).sort();

  function completeEvent(event) {
    if (!event.day) return;
    onSetDayCompleted(event.releaseId, event.day.date, true);
  }

  function changeEventDate(event, date) {
    if (!event.orientation?.id || !date) return;
    onUpdateOrientation(event.orientation.id, { date });
  }

  if (!releases.length) {
    return <section className="page-content"><PageHeader eyebrow="Operacao" title="Calendario Geral" /><EmptyState title="Nenhum lancamento cadastrado" text="O calendario geral aparece quando houver estrategias ou marcos de lancamento." /></section>;
  }

  return (
    <section className="page-content pro-page">
      <PageHeader eyebrow="Operacao" title="Calendario Geral">
        <button className="secondary-button" onClick={() => onNavigate('artistView')} type="button">Visao do Artista</button>
        <button className="secondary-button" onClick={() => onNavigate('diagnosis')} type="button">Diagnostico</button>
      </PageHeader>

      <section className="pro-selector panel multi">
        <label>Visualizacao<select value={view} onChange={(event) => setView(event.target.value)}><option value="today">Hoje</option><option value="week">Proximos 7 dias</option><option value="list">Lista</option><option value="month">Mensal</option></select></label>
        <label>Artista<select value={artistId} onChange={(event) => setArtistId(event.target.value)}><option value="all">Todos</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.stageName}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="pending">Pendentes</option><option value="done">Concluidos</option><option value="late">Atrasados</option></select></label>
        <label>Prioridade<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Todas</option><option value="alta">Alta</option><option value="media">Media</option><option value="baixa">Baixa</option></select></label>
      </section>

      <section className="panel global-calendar-summary">
        <div><Clock size={18} /><strong>Hoje</strong><span>{events.filter((event) => event.date === today).length} evento(s)</span></div>
        <div><CalendarDays size={18} /><strong>7 dias</strong><span>{events.filter((event) => event.date >= today && event.date <= weekEnd).length} evento(s)</span></div>
        <div><CheckCircle2 size={18} /><strong>Atrasados</strong><span>{events.filter((event) => event.date < today && !event.completed).length} evento(s)</span></div>
      </section>

      {view === 'month' ? (
        <section className="global-month-grid">
          {monthDates.map((date) => <article className="panel global-month-day" key={date}><strong>{formatFullDate(date)}</strong><div className="pro-stack">{(grouped[date] || []).map((event) => <EventCard event={event} artistIndex={artistIndex.get(event.artistId) || 0} key={event.id} onOpen={setSelectedEvent} onComplete={completeEvent} />)}</div></article>)}
        </section>
      ) : (
        <section className="pro-stack">
          {Object.entries(grouped).map(([date, dateEvents]) => <div className="panel" key={date}><div className="panel-heading"><h2>{date === today ? 'Hoje' : formatFullDate(date)}</h2><StatusBadge>{dateEvents.length} evento(s)</StatusBadge></div><div className="pro-stack">{dateEvents.map((event) => <EventCard event={event} artistIndex={artistIndex.get(event.artistId) || 0} key={event.id} onOpen={setSelectedEvent} onComplete={completeEvent} />)}</div></div>)}
          {!filteredEvents.length && <EmptyState title="Nada encontrado" text="Ajuste filtros ou gere uma estrategia para os lancamentos." />}
        </section>
      )}

      {selectedEvent && (
        <div className="pro-modal-backdrop" role="presentation" onClick={() => setSelectedEvent(null)}>
          <article className="pro-modal panel" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading"><div><span className="eyebrow">Evento</span><h2>{selectedEvent.title}</h2></div><button className="icon-button" onClick={() => setSelectedEvent(null)} type="button">×</button></div>
            <p className="muted-copy">{selectedEvent.description || 'Marco importante do calendario.'}</p>
            <div className="pitch-mini-list"><span>Artista: <strong>{selectedEvent.artist?.stageName || 'Nao informado'}</strong></span><span>Lancamento: <strong>{selectedEvent.release?.songTitle || 'Nao informado'}</strong></span><span>Fase: <strong>{selectedEvent.phase}</strong></span><span>Status: <strong>{selectedEvent.status}</strong></span></div>
            {selectedEvent.kind === 'task' && <label>Alterar data<input type="date" value={selectedEvent.date} onChange={(event) => changeEventDate(selectedEvent, event.target.value)} /></label>}
            <div className="pro-actions-row">
              {selectedEvent.kind === 'task' && <button className="primary-button" onClick={() => completeEvent(selectedEvent)} type="button"><CheckCircle2 size={16} />Marcar como concluido</button>}
              {selectedEvent.kind === 'task' && selectedEvent.orientation && <button className="secondary-button" onClick={() => onRegenerateOrientation(selectedEvent.day, selectedEvent.orientation, selectedEvent.day.orientations.indexOf(selectedEvent.orientation))} type="button"><RefreshCw size={16} />Trocar sugestao</button>}
              <button className="secondary-button" onClick={() => onNavigate('releases')} type="button"><Edit3 size={16} />Abrir lancamento</button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
