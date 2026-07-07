import { useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { LinksPage } from './pages/LinksPage';
import { SettingsPage } from './pages/SettingsPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { buildPlanDays, generateTasksForRelease, getDayKey } from './utils/calendar';
import { exportTasksCsv } from './utils/csv';
import { createDemoData } from './data/demoData';
import { addDays, diffInDays, formatDateInput } from './utils/date';
import { createId } from './utils/id';

const STORAGE = {
  artists: 'artist-release-hub:artists',
  releases: 'artist-release-hub:releases',
  tasks: 'artist-release-hub:tasks',
  dayCompletions: 'artist-release-hub:day-completions',
};

function sortByDate(items) {
  return [...items].sort((a, b) => (a.date || a.releaseDate || '').localeCompare(b.date || b.releaseDate || ''));
}

function normalizeRelease(release) {
  return {
    ...release,
    presaveDate: release.presaveDate || formatDateInput(addDays(release.releaseDate, -14)),
  };
}

function removeCompletionKeys(current, releaseIds) {
  const releaseSet = new Set(releaseIds);
  return Object.fromEntries(
    Object.entries(current).filter(([key]) => {
      const [releaseId] = key.split(':');
      return !releaseSet.has(releaseId);
    }),
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [artists, setArtists] = useLocalStorage(STORAGE.artists, []);
  const [releases, setReleases] = useLocalStorage(STORAGE.releases, []);
  const [tasks, setTasks] = useLocalStorage(STORAGE.tasks, []);
  const [dayCompletions, setDayCompletions] = useLocalStorage(STORAGE.dayCompletions, {});

  const sortedArtists = useMemo(
    () => [...artists].sort((a, b) => a.stageName.localeCompare(b.stageName)),
    [artists],
  );
  const sortedReleases = useMemo(() => sortByDate(releases), [releases]);
  const sortedTasks = useMemo(() => sortByDate(tasks), [tasks]);
  const planDays = useMemo(
    () => buildPlanDays(sortedTasks, sortedReleases, sortedArtists, dayCompletions),
    [sortedTasks, sortedReleases, sortedArtists, dayCompletions],
  );

  function saveArtist(artist) {
    const normalized = {
      ...artist,
      stageName: artist.stageName.trim(),
      id: artist.id || createId('artist'),
      createdAt: artist.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setArtists((current) =>
      artist.id ? current.map((item) => (item.id === artist.id ? normalized : item)) : [...current, normalized],
    );
  }

  function deleteArtist(artistId) {
    const releaseIds = releases.filter((release) => release.artistId === artistId).map((release) => release.id);
    setArtists((current) => current.filter((artist) => artist.id !== artistId));
    setReleases((current) => current.filter((release) => release.artistId !== artistId));
    setTasks((current) => current.filter((task) => task.artistId !== artistId && !releaseIds.includes(task.releaseId)));
    setDayCompletions((current) => removeCompletionKeys(current, releaseIds));
  }

  function saveRelease(release) {
    const normalized = normalizeRelease({
      ...release,
      songTitle: release.songTitle.trim(),
      id: release.id || createId('release'),
      createdAt: release.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setReleases((current) =>
      release.id ? current.map((item) => (item.id === release.id ? normalized : item)) : [...current, normalized],
    );

    setTasks((current) => {
      const existingForRelease = current.filter((task) => task.releaseId === normalized.id);
      const others = current.filter((task) => task.releaseId !== normalized.id);
      return sortByDate([...others, ...generateTasksForRelease(normalized, existingForRelease)]);
    });
  }

  function deleteRelease(releaseId) {
    setReleases((current) => current.filter((release) => release.id !== releaseId));
    setTasks((current) => current.filter((task) => task.releaseId !== releaseId));
    setDayCompletions((current) => removeCompletionKeys(current, [releaseId]));
  }

  function setDayCompleted(releaseId, date, completed) {
    const key = getDayKey(releaseId, date);
    setDayCompletions((current) => {
      if (completed) return { ...current, [key]: true };
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateOrientation(orientationId, patch) {
    setTasks((current) => current.map((task) => (task.id === orientationId ? { ...task, ...patch } : task)));
  }

  function addOrientation(day, title) {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const release = releases.find((item) => item.id === day.releaseId);
    if (!release) return;

    const orientation = {
      id: createId('orientation'),
      templateId: 'custom',
      releaseId: day.releaseId,
      artistId: release.artistId,
      title: cleanTitle,
      description: '',
      type: 'orientação',
      date: day.date,
      status: 'não concluído',
      priority: 'média',
      note: '',
      link: '',
      offset: typeof day.offset === 'number' ? day.offset : diffInDays(day.date, release.releaseDate),
    };

    setTasks((current) => sortByDate([...current, orientation]));
  }

  function deleteOrientation(orientationId) {
    setTasks((current) => current.filter((task) => task.id !== orientationId));
  }

  function regenerateRelease(releaseId) {
    const release = releases.find((item) => item.id === releaseId);
    if (!release) return;
    setTasks((current) => {
      const existingForRelease = current.filter((task) => task.releaseId === release.id);
      const others = current.filter((task) => task.releaseId !== release.id);
      return sortByDate([...others, ...generateTasksForRelease(release, existingForRelease)]);
    });
  }

  function regenerateAllCalendars() {
    setTasks((current) => {
      const nextTasks = releases.flatMap((release) =>
        generateTasksForRelease(
          release,
          current.filter((task) => task.releaseId === release.id),
        ),
      );
      return sortByDate(nextTasks);
    });
  }

  function loadDemoData() {
    if ((artists.length || releases.length || tasks.length) && !window.confirm('Substituir os dados atuais pelo exemplo?')) {
      return;
    }
    const demo = createDemoData();
    setArtists(demo.artists);
    setReleases(demo.releases);
    setTasks(demo.tasks);
    setDayCompletions(demo.dayCompletions || {});
    setActivePage('dashboard');
  }

  function clearData() {
    if (!window.confirm('Apagar artistas, lançamentos e orientações salvos neste navegador?')) return;
    setArtists([]);
    setReleases([]);
    setTasks([]);
    setDayCompletions({});
    setActivePage('dashboard');
  }

  function exportCsv() {
    exportTasksCsv(planDays);
  }

  const commonProps = {
    artists: sortedArtists,
    releases: sortedReleases,
    tasks: sortedTasks,
    planDays,
    dayCompletions,
  };

  const dayActions = {
    onSetDayCompleted: setDayCompleted,
    onUpdateOrientation: updateOrientation,
    onAddOrientation: addOrientation,
    onDeleteOrientation: deleteOrientation,
  };

  const pages = {
    dashboard: <DashboardPage {...commonProps} onNavigate={setActivePage} />,
    artists: (
      <ArtistsPage
        {...commonProps}
        onSave={saveArtist}
        onDelete={deleteArtist}
      />
    ),
    releases: (
      <ReleasesPage
        {...commonProps}
        onSave={saveRelease}
        onDelete={deleteRelease}
        onRegenerate={regenerateRelease}
        onNavigate={setActivePage}
      />
    ),
    calendar: (
      <CalendarPage
        {...commonProps}
        {...dayActions}
        onExportCsv={exportCsv}
      />
    ),
    tasks: (
      <TasksPage
        {...commonProps}
        {...dayActions}
        onExportCsv={exportCsv}
      />
    ),
    links: <LinksPage {...commonProps} />,
    settings: (
      <SettingsPage
        {...commonProps}
        onLoadDemo={loadDemoData}
        onClearData={clearData}
        onRegenerateAll={regenerateAllCalendars}
      />
    ),
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onChangePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className="main-area">{pages[activePage]}</main>
    </div>
  );
}
