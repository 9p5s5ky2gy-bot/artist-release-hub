import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { CloudSetupPage } from './components/CloudSetupPage';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { LinksPage } from './pages/LinksPage';
import { SettingsPage } from './pages/SettingsPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { hasWorkspaceData, loadWorkspace, normalizeWorkspace, saveWorkspace } from './lib/workspaceStore';
import { buildPlanDays, generateTasksForRelease, getDayKey } from './utils/calendar';
import { generateRandomActionsForRelease } from './utils/randomPlan';
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
  const { shouldGenerateRandomPlan, ...cleanRelease } = release;
  return {
    ...cleanRelease,
    releaseType: cleanRelease.releaseType || cleanRelease.type || 'Single',
    coverImageUrl: cleanRelease.coverImageUrl || cleanRelease.coverUrl || '',
    presaveDate: cleanRelease.presaveDate || formatDateInput(addDays(cleanRelease.releaseDate, -14)),
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
  const auth = useSupabaseAuth();
  const [workspaceReloadKey, setWorkspaceReloadKey] = useState(0);
  const [cloudState, setCloudState] = useState({
    loading: auth.configured,
    ready: !auth.configured,
    saving: false,
    error: '',
    lastSaved: '',
  });
  const saveTimerRef = useRef(null);
  const hydratedUserRef = useRef('');
  const lastPayloadRef = useRef('');

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
  const workspaceSnapshot = useMemo(
    () => normalizeWorkspace({ artists, releases, tasks, dayCompletions }),
    [artists, releases, tasks, dayCompletions],
  );

  useEffect(() => {
    if (!auth.configured) {
      setCloudState({ loading: false, ready: true, saving: false, error: '', lastSaved: '' });
      return undefined;
    }

    if (auth.loading) return undefined;

    if (!auth.user?.id) {
      if (hydratedUserRef.current) {
        setArtists([]);
        setReleases([]);
        setTasks([]);
        setDayCompletions({});
      }

      hydratedUserRef.current = '';
      lastPayloadRef.current = '';
      window.clearTimeout(saveTimerRef.current);
      setCloudState({ loading: false, ready: false, saving: false, error: '', lastSaved: '' });
      return undefined;
    }

    let cancelled = false;
    const localSnapshot = normalizeWorkspace({ artists, releases, tasks, dayCompletions });

    setCloudState((current) => ({ ...current, loading: true, ready: false, error: '' }));

    loadWorkspace(auth.user.id)
      .then(({ workspace, exists, updatedAt }) => {
        if (cancelled) return;

        const shouldImportLocal = !exists && hasWorkspaceData(localSnapshot);
        const nextWorkspace = shouldImportLocal ? localSnapshot : workspace;

        setArtists(nextWorkspace.artists);
        setReleases(nextWorkspace.releases);
        setTasks(nextWorkspace.tasks);
        setDayCompletions(nextWorkspace.dayCompletions);

        hydratedUserRef.current = auth.user.id;
        lastPayloadRef.current = JSON.stringify(nextWorkspace);
        setCloudState({
          loading: false,
          ready: true,
          saving: shouldImportLocal,
          error: '',
          lastSaved: updatedAt || '',
        });

        if (shouldImportLocal) {
          saveWorkspace(auth.user.id, nextWorkspace)
            .then((savedAt) => {
              if (!cancelled) {
                setCloudState((current) => ({ ...current, saving: false, lastSaved: savedAt }));
              }
            })
            .catch((error) => {
              if (!cancelled) {
                setCloudState((current) => ({ ...current, saving: false, error: error.message }));
              }
            });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        hydratedUserRef.current = '';
        setCloudState({
          loading: false,
          ready: false,
          saving: false,
          error: error.message || 'Não foi possível carregar os dados na nuvem.',
          lastSaved: '',
        });
      });

    return () => {
      cancelled = true;
    };
    // A hidratação deve acontecer apenas ao trocar usuário ou ao clicar em tentar novamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.configured, auth.loading, auth.user?.id, workspaceReloadKey]);

  useEffect(() => {
    if (
      !auth.configured ||
      !auth.user?.id ||
      !cloudState.ready ||
      cloudState.loading ||
      hydratedUserRef.current !== auth.user.id
    ) {
      return undefined;
    }

    const payload = JSON.stringify(workspaceSnapshot);
    if (payload === lastPayloadRef.current) return undefined;

    window.clearTimeout(saveTimerRef.current);
    setCloudState((current) => ({ ...current, saving: true, error: '' }));

    saveTimerRef.current = window.setTimeout(() => {
      saveWorkspace(auth.user.id, workspaceSnapshot)
        .then((savedAt) => {
          lastPayloadRef.current = payload;
          setCloudState((current) => ({ ...current, saving: false, lastSaved: savedAt }));
        })
        .catch((error) => {
          setCloudState((current) => ({
            ...current,
            saving: false,
            error: error.message || 'Não foi possível salvar na nuvem.',
          }));
        });
    }, 650);

    return () => window.clearTimeout(saveTimerRef.current);
  }, [auth.configured, auth.user?.id, cloudState.loading, cloudState.ready, workspaceSnapshot]);

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
    const shouldGenerateRandomPlan = Boolean(release.shouldGenerateRandomPlan);
    const normalized = normalizeRelease({
      ...release,
      songTitle: release.songTitle.trim(),
      id: release.id || createId('release'),
      createdAt: release.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const releaseToSave = shouldGenerateRandomPlan
      ? {
          ...normalized,
          planMode: 'random',
          randomPlanSeed: Date.now(),
          randomPlanGeneratedAt: new Date().toISOString(),
        }
      : normalized;

    setReleases((current) =>
      release.id ? current.map((item) => (item.id === release.id ? releaseToSave : item)) : [...current, releaseToSave],
    );

    setTasks((current) => {
      const existingForRelease = current.filter((task) => task.releaseId === releaseToSave.id);
      const others = current.filter((task) => task.releaseId !== releaseToSave.id);
      if (shouldGenerateRandomPlan) {
        const artist = artists.find((item) => item.id === releaseToSave.artistId);
        return sortByDate([
          ...others,
          ...generateRandomActionsForRelease(releaseToSave, artist, releaseToSave.randomPlanSeed),
        ]);
      }
      return sortByDate([...others, ...generateTasksForRelease(releaseToSave, existingForRelease)]);
    });

    if (shouldGenerateRandomPlan) {
      setDayCompletions((current) => removeCompletionKeys(current, [releaseToSave.id]));
    }
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

  function generateRandomPlanForRelease(releaseId) {
    const release = releases.find((item) => item.id === releaseId);
    if (!release) return;
    if (!window.confirm('Gerar novas ações aleatórias e substituir as orientações atuais deste lançamento?')) return;

    const seed = Date.now();
    const randomRelease = {
      ...release,
      releaseType: release.releaseType || release.type || 'Single',
      planMode: 'random',
      randomPlanSeed: seed,
      randomPlanGeneratedAt: new Date().toISOString(),
    };
    const artist = artists.find((item) => item.id === release.artistId);

    setReleases((current) => current.map((item) => (item.id === releaseId ? randomRelease : item)));
    setTasks((current) => {
      const others = current.filter((task) => task.releaseId !== releaseId);
      return sortByDate([...others, ...generateRandomActionsForRelease(randomRelease, artist, seed)]);
    });
    setDayCompletions((current) => removeCompletionKeys(current, [releaseId]));
  }

  function clearGeneratedPlanForRelease(releaseId) {
    const release = releases.find((item) => item.id === releaseId);
    if (!release) return;
    if (!window.confirm('Limpar as ações aleatórias deste lançamento?')) return;

    setReleases((current) =>
      current.map((item) =>
        item.id === releaseId
          ? { ...item, planMode: '', randomPlanSeed: null, randomPlanGeneratedAt: null }
          : item,
      ),
    );
    setTasks((current) =>
      current.filter((task) => task.releaseId !== releaseId || (task.templateId !== 'random-plan' && !task.generatedPlan)),
    );
    setDayCompletions((current) => removeCompletionKeys(current, [releaseId]));
  }

  function regenerateRelease(releaseId) {
    const release = releases.find((item) => item.id === releaseId);
    if (!release) return;
    const standardRelease = { ...release, planMode: '', randomPlanSeed: null, randomPlanGeneratedAt: null };
    setReleases((current) => current.map((item) => (item.id === releaseId ? standardRelease : item)));
    setTasks((current) => {
      const existingForRelease = current.filter((task) => task.releaseId === release.id);
      const others = current.filter((task) => task.releaseId !== release.id);
      return sortByDate([...others, ...generateTasksForRelease(standardRelease, existingForRelease)]);
    });
    setDayCompletions((current) => removeCompletionKeys(current, [releaseId]));
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
    const target = auth.configured ? 'da sua conta em nuvem e deste navegador' : 'salvos neste navegador';
    if (!window.confirm(`Apagar artistas, lançamentos e orientações ${target}?`)) return;
    setArtists([]);
    setReleases([]);
    setTasks([]);
    setDayCompletions({});
    setActivePage('dashboard');
  }

  function exportCsv() {
    exportTasksCsv(planDays);
  }

  async function handleSignOut() {
    if (auth.configured && auth.user?.id && cloudState.ready) {
      window.clearTimeout(saveTimerRef.current);
      try {
        await saveWorkspace(auth.user.id, workspaceSnapshot);
      } catch {
        // O logout não deve prender o usuário se houver uma falha momentânea de rede.
      }
    }

    await auth.signOut();
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
        onGenerateRandomPlan={generateRandomPlanForRelease}
        onClearGeneratedPlan={clearGeneratedPlanForRelease}
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
        cloudState={cloudState}
        userEmail={auth.userEmail}
        isCloudConfigured={auth.configured}
        onSignOut={handleSignOut}
        onLoadDemo={loadDemoData}
        onClearData={clearData}
        onRegenerateAll={regenerateAllCalendars}
      />
    ),
  };

  if (auth.configured && (auth.loading || (auth.session && cloudState.loading && !cloudState.ready))) {
    return (
      <main className="auth-shell">
        <section className="auth-card loading-card">
          <div className="brand-mark auth-brand" />
          <span className="eyebrow">Artist Release Hub Cloud</span>
          <h1>Carregando seus dados</h1>
          <p>Conectando login, banco e calendário de lançamentos.</p>
        </section>
      </main>
    );
  }

  if (auth.configured && !auth.session) {
    return (
      <AuthPage
        configured={auth.configured}
        loading={auth.loading}
        authError={auth.authError}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
      />
    );
  }

  if (auth.configured && auth.session && cloudState.error && !cloudState.ready) {
    return (
      <CloudSetupPage
        error={cloudState.error}
        onRetry={() => setWorkspaceReloadKey((current) => current + 1)}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onChangePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        cloudState={cloudState}
        isCloudConfigured={auth.configured}
        userEmail={auth.userEmail}
        onSignOut={handleSignOut}
      />
      <main className="main-area">{pages[activePage]}</main>
    </div>
  );
}
