import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { CloudSetupPage } from './components/CloudSetupPage';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { ArtistViewPage } from './pages/ArtistViewPage';
import { DiagnosisPage } from './pages/DiagnosisPage';
import { GeneralCalendarPage } from './pages/GeneralCalendarPage';
import { BriefingsPage } from './pages/BriefingsPage';
import { FinancePage } from './pages/FinancePage';
import { ComparePage } from './pages/ComparePage';
import { ReportsPage } from './pages/ReportsPage';
import { PitchingPage } from './pages/PitchingPage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { LinksPage } from './pages/LinksPage';
import { SettingsPage } from './pages/SettingsPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Undo2 } from 'lucide-react';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { hasWorkspaceData, loadWorkspace, normalizeWorkspace, saveWorkspace } from './lib/workspaceStore';
import { buildPlanDays, generateTasksForRelease, getDayKey } from './utils/calendar';
import { generateRandomActionForDay, generateRandomActionsForRelease } from './utils/randomPlan';
import { getDailyActionCount } from './utils/release';
import { exportTasksCsv } from './utils/csv';
import { createDemoData } from './data/demoData';
import { addDays, diffInDays, formatDateInput } from './utils/date';
import { createId } from './utils/id';

const STORAGE = {
  artists: 'artist-release-hub:artists',
  releases: 'artist-release-hub:releases',
  tasks: 'artist-release-hub:tasks',
  dayCompletions: 'artist-release-hub:day-completions',
  pitching: 'artist-release-hub:pitching',
  pitchBriefs: 'artist-release-hub:pitch-briefs',
  pitchChecklists: 'artist-release-hub:pitch-checklists',
  briefings: 'artist-release-hub:briefings',
  reports: 'artist-release-hub:reports',
};

function sortByDate(items) {
  return [...items].sort((a, b) => (a.date || a.releaseDate || '').localeCompare(b.date || b.releaseDate || ''));
}

function normalizeRelease(release) {
  const { shouldGenerateRandomPlan, ...cleanRelease } = release;
  return {
    ...cleanRelease,
    releaseType: cleanRelease.releaseType || cleanRelease.type || 'Single',
    dailyActionCount: getDailyActionCount(cleanRelease),
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

function selectCompletionKeys(current, releaseIds) {
  const releaseSet = new Set(releaseIds);
  return Object.fromEntries(
    Object.entries(current || {}).filter(([key]) => releaseSet.has(key.split(':')[0])),
  );
}



function removePitchKeys(current, releaseIds = [], artistId = '') {
  const releaseSet = new Set(releaseIds);
  return Object.fromEntries(
    Object.entries(current || {}).filter(([key]) => {
      const [keyArtistId, keyReleaseId] = key.split(':');
      return keyArtistId !== artistId && !releaseSet.has(keyReleaseId);
    }),
  );
}

function selectPitchKeys(current, releaseIds = [], artistId = '') {
  const releaseSet = new Set(releaseIds);
  return Object.fromEntries(
    Object.entries(current || {}).filter(([key]) => {
      const [keyArtistId, keyReleaseId] = key.split(':');
      return keyArtistId === artistId || releaseSet.has(keyReleaseId);
    }),
  );
}

function restoreMissingItems(current, removed, prepend = false) {
  const currentIds = new Set(current.map((item) => item?.id).filter(Boolean));
  const missing = removed.filter((item) => !item?.id || !currentIds.has(item.id));
  return prepend ? [...missing, ...current] : [...current, ...missing];
}

function isOrientationCompleted(orientation) {
  const status = String(orientation?.status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return ['feito', 'concluido', 'completed', 'done'].includes(status);
}

function hasRandomPlan(release, releaseTasks = []) {
  return Boolean(
    release?.planMode === 'random' ||
      release?.randomPlanGeneratedAt ||
      releaseTasks.some((task) => task.generatedPlan || task.templateId === 'random-plan'),
  );
}

function releaseStrategyChanged(previousRelease, nextRelease) {
  if (!previousRelease) return true;

  const previousType = previousRelease.releaseType || previousRelease.type || 'Single';
  const nextType = nextRelease.releaseType || nextRelease.type || 'Single';

  return (
    previousRelease.artistId !== nextRelease.artistId ||
    previousRelease.releaseDate !== nextRelease.releaseDate ||
    previousRelease.presaveDate !== nextRelease.presaveDate ||
    previousType !== nextType ||
    getDailyActionCount(previousRelease) !== getDailyActionCount(nextRelease)
  );
}

function syncTasksWithReleaseMetadata(releaseTasks, release) {
  return releaseTasks.map((task) => ({
    ...task,
    releaseId: release.id,
    artistId: release.artistId,
  }));
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [artists, setArtists] = useLocalStorage(STORAGE.artists, []);
  const [releases, setReleases] = useLocalStorage(STORAGE.releases, []);
  const [tasks, setTasks] = useLocalStorage(STORAGE.tasks, []);
  const [dayCompletions, setDayCompletions] = useLocalStorage(STORAGE.dayCompletions, {});
  const [pitching, setPitching] = useLocalStorage(STORAGE.pitching, []);
  const [pitchBriefs, setPitchBriefs] = useLocalStorage(STORAGE.pitchBriefs, {});
  const [pitchChecklists, setPitchChecklists] = useLocalStorage(STORAGE.pitchChecklists, {});
  const [briefings, setBriefings] = useLocalStorage(STORAGE.briefings, []);
  const [reports, setReports] = useLocalStorage(STORAGE.reports, []);
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
  const undoStackRef = useRef([]);
  const undoNoticeTimerRef = useRef(null);
  const [undoHistory, setUndoHistory] = useState([]);
  const [undoNotice, setUndoNotice] = useState('');

  const sortedArtists = useMemo(
    () => [...artists].sort((a, b) => String(a.stageName || '').localeCompare(String(b.stageName || ''))),
    [artists],
  );
  const sortedReleases = useMemo(() => sortByDate(releases), [releases]);
  const sortedTasks = useMemo(() => sortByDate(tasks), [tasks]);
  const planDays = useMemo(
    () => buildPlanDays(sortedTasks, sortedReleases, sortedArtists, dayCompletions),
    [sortedTasks, sortedReleases, sortedArtists, dayCompletions],
  );
  const workspaceSnapshot = useMemo(
    () => normalizeWorkspace({ artists, releases, tasks, dayCompletions, pitching, pitchBriefs, pitchChecklists, briefings, reports }),
    [artists, releases, tasks, dayCompletions, pitching, pitchBriefs, pitchChecklists, briefings, reports],
  );

  useEffect(() => {
    undoStackRef.current = [];
    setUndoHistory([]);
    setUndoNotice('');
  }, [auth.user?.id]);

  useEffect(() => () => window.clearTimeout(undoNoticeTimerRef.current), []);


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
        setPitching([]);
        setPitchBriefs({});
        setPitchChecklists({});
        setBriefings([]);
        setReports([]);
      }

      hydratedUserRef.current = '';
      lastPayloadRef.current = '';
      window.clearTimeout(saveTimerRef.current);
      setCloudState({ loading: false, ready: false, saving: false, error: '', lastSaved: '' });
      return undefined;
    }

    let cancelled = false;
    const localSnapshot = normalizeWorkspace({ artists, releases, tasks, dayCompletions, pitching, pitchBriefs, pitchChecklists, briefings, reports });

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
        setPitching(nextWorkspace.pitching);
        setPitchBriefs(nextWorkspace.pitchBriefs);
        setPitchChecklists(nextWorkspace.pitchChecklists);
        setBriefings(nextWorkspace.briefings);
        setReports(nextWorkspace.reports);

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

  function syncUndoHistory(stack) {
    setUndoHistory(stack.map(({ id, label }) => ({ id, label })));
  }

  function registerDeletionUndo(label, restore) {
    const nextStack = [...undoStackRef.current.slice(-9), { id: createId('undo'), label, restore }];
    undoStackRef.current = nextStack;
    syncUndoHistory(nextStack);
    setUndoNotice(`${label} pode ser restaurado.`);
    window.clearTimeout(undoNoticeTimerRef.current);
    undoNoticeTimerRef.current = window.setTimeout(() => setUndoNotice(''), 3200);
  }

  function undoLastDeletion() {
    const entry = undoStackRef.current.at(-1);
    if (!entry) return;

    const nextStack = undoStackRef.current.slice(0, -1);
    undoStackRef.current = nextStack;
    syncUndoHistory(nextStack);
    entry.restore();
    setUndoNotice(`${entry.label} restaurado.`);
    window.clearTimeout(undoNoticeTimerRef.current);
    undoNoticeTimerRef.current = window.setTimeout(() => setUndoNotice(''), 3200);
  }

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
    const removedArtist = artists.find((artist) => artist.id === artistId);
    if (!removedArtist) return;
    const releaseSet = new Set(releaseIds);
    const removedReleases = releases.filter((release) => release.artistId === artistId);
    const removedTasks = tasks.filter((task) => task.artistId === artistId || releaseSet.has(task.releaseId));
    const removedCompletions = selectCompletionKeys(dayCompletions, releaseIds);
    const removedPitching = pitching.filter((item) => item.artistId === artistId || releaseSet.has(item.releaseId));
    const removedPitchBriefs = selectPitchKeys(pitchBriefs, releaseIds, artistId);
    const removedPitchChecklists = selectPitchKeys(pitchChecklists, releaseIds, artistId);
    const removedBriefings = briefings.filter((item) => item.artistId === artistId || releaseSet.has(item.releaseId));
    const removedReports = reports.filter((item) => item.artistId === artistId || releaseSet.has(item.releaseId));

    registerDeletionUndo(`Artista "${removedArtist.stageName || 'sem nome'}"`, () => {
      setArtists((current) => restoreMissingItems(current, [removedArtist]));
      setReleases((current) => sortByDate(restoreMissingItems(current, removedReleases)));
      setTasks((current) => sortByDate(restoreMissingItems(current, removedTasks)));
      setDayCompletions((current) => ({ ...removedCompletions, ...current }));
      setPitching((current) => restoreMissingItems(current, removedPitching, true));
      setPitchBriefs((current) => ({ ...removedPitchBriefs, ...current }));
      setPitchChecklists((current) => ({ ...removedPitchChecklists, ...current }));
      setBriefings((current) => restoreMissingItems(current, removedBriefings, true));
      setReports((current) => restoreMissingItems(current, removedReports, true));
    });

    setArtists((current) => current.filter((artist) => artist.id !== artistId));
    setReleases((current) => current.filter((release) => release.artistId !== artistId));
    setTasks((current) => current.filter((task) => task.artistId !== artistId && !releaseIds.includes(task.releaseId)));
    setDayCompletions((current) => removeCompletionKeys(current, releaseIds));
    setPitching((current) => current.filter((item) => item.artistId !== artistId && !releaseIds.includes(item.releaseId)));
    setPitchBriefs((current) => removePitchKeys(current, releaseIds, artistId));
    setPitchChecklists((current) => removePitchKeys(current, releaseIds, artistId));
    setBriefings((current) => current.filter((item) => item.artistId !== artistId && !releaseIds.includes(item.releaseId)));
    setReports((current) => current.filter((item) => item.artistId !== artistId && !releaseIds.includes(item.releaseId)));
  }

  function saveRelease(release) {
    const songTitle = String(release?.songTitle || '').trim();
    if (!release?.artistId || !songTitle || !release?.releaseDate) {
      throw new Error('Preencha artista, nome da música e data de lançamento.');
    }
    const shouldGenerateRandomPlan = Boolean(release.shouldGenerateRandomPlan);
    const existingRelease = releases.find((item) => item.id === release.id);
    const existingTasksForRelease = tasks.filter((task) => task.releaseId === release.id);
    const normalized = normalizeRelease({
      ...release,
      songTitle,
      id: release.id || createId('release'),
      createdAt: release.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const shouldKeepRandomPlan = !shouldGenerateRandomPlan && hasRandomPlan(normalized, existingTasksForRelease);
    const shouldUseRandomPlan = shouldGenerateRandomPlan || shouldKeepRandomPlan;
    const strategyChanged = shouldUseRandomPlan && releaseStrategyChanged(existingRelease, normalized);
    const randomPlanSeed = shouldGenerateRandomPlan
      ? Date.now()
      : normalized.randomPlanSeed || existingRelease?.randomPlanSeed || Date.now();
    const releaseToSave = shouldUseRandomPlan
      ? {
          ...normalized,
          planMode: 'random',
          randomPlanSeed,
          randomPlanGeneratedAt:
            shouldGenerateRandomPlan || strategyChanged
              ? new Date().toISOString()
              : normalized.randomPlanGeneratedAt || existingRelease?.randomPlanGeneratedAt || new Date().toISOString(),
        }
      : normalized;

    setReleases((current) =>
      release.id ? current.map((item) => (item.id === release.id ? releaseToSave : item)) : [...current, releaseToSave],
    );

    setTasks((current) => {
      const existingForRelease = current.filter((task) => task.releaseId === releaseToSave.id);
      const others = current.filter((task) => task.releaseId !== releaseToSave.id);
      const hasRandomTasks = existingForRelease.some((task) => task.generatedPlan || task.templateId === 'random-plan');
      const needsRandomRegeneration = shouldGenerateRandomPlan || strategyChanged || !hasRandomTasks;

      if (shouldUseRandomPlan) {
        const artist = artists.find((item) => item.id === releaseToSave.artistId);
        if (!needsRandomRegeneration) {
          return sortByDate([...others, ...syncTasksWithReleaseMetadata(existingForRelease, releaseToSave)]);
        }

        return sortByDate([
          ...others,
          ...generateRandomActionsForRelease(releaseToSave, artist, releaseToSave.randomPlanSeed),
        ]);
      }
      return sortByDate([...others, ...generateTasksForRelease(releaseToSave, existingForRelease)]);
    });

    if (shouldGenerateRandomPlan || strategyChanged) {
      setDayCompletions((current) => removeCompletionKeys(current, [releaseToSave.id]));
    }
  }
  function patchRelease(releaseId, patch) {
    setReleases((current) =>
      current.map((release) =>
        release.id === releaseId
          ? { ...release, ...patch, updatedAt: new Date().toISOString() }
          : release,
      ),
    );
  }
  function deleteRelease(releaseId) {
    const removedRelease = releases.find((release) => release.id === releaseId);
    if (!removedRelease) return;
    const removedTasks = tasks.filter((task) => task.releaseId === releaseId);
    const removedCompletions = selectCompletionKeys(dayCompletions, [releaseId]);
    const removedPitching = pitching.filter((item) => item.releaseId === releaseId);
    const removedPitchBriefs = selectPitchKeys(pitchBriefs, [releaseId]);
    const removedPitchChecklists = selectPitchKeys(pitchChecklists, [releaseId]);
    const removedBriefings = briefings.filter((item) => item.releaseId === releaseId);
    const removedReports = reports.filter((item) => item.releaseId === releaseId);

    registerDeletionUndo(`Lançamento "${removedRelease.songTitle || 'sem título'}"`, () => {
      setReleases((current) => sortByDate(restoreMissingItems(current, [removedRelease])));
      setTasks((current) => sortByDate(restoreMissingItems(current, removedTasks)));
      setDayCompletions((current) => ({ ...removedCompletions, ...current }));
      setPitching((current) => restoreMissingItems(current, removedPitching, true));
      setPitchBriefs((current) => ({ ...removedPitchBriefs, ...current }));
      setPitchChecklists((current) => ({ ...removedPitchChecklists, ...current }));
      setBriefings((current) => restoreMissingItems(current, removedBriefings, true));
      setReports((current) => restoreMissingItems(current, removedReports, true));
    });

    setReleases((current) => current.filter((release) => release.id !== releaseId));
    setTasks((current) => current.filter((task) => task.releaseId !== releaseId));
    setDayCompletions((current) => removeCompletionKeys(current, [releaseId]));
    setPitching((current) => current.filter((item) => item.releaseId !== releaseId));
    setPitchBriefs((current) => removePitchKeys(current, [releaseId]));
    setPitchChecklists((current) => removePitchKeys(current, [releaseId]));
    setBriefings((current) => current.filter((item) => item.releaseId !== releaseId));
    setReports((current) => current.filter((item) => item.releaseId !== releaseId));
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
    const marksManualEdit = ['title', 'description', 'type', 'priority', 'note', 'link'].some((field) =>
      Object.prototype.hasOwnProperty.call(patch, field),
    );

    setTasks((current) =>
      current.map((task) =>
        task.id === orientationId
          ? { ...task, ...patch, manuallyEdited: marksManualEdit ? true : task.manuallyEdited }
          : task,
      ),
    );
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
    const removedOrientation = tasks.find((task) => task.id === orientationId);
    if (!removedOrientation) return;
    registerDeletionUndo(`Ação "${removedOrientation.title || 'sem título'}"`, () => {
      setTasks((current) => sortByDate(restoreMissingItems(current, [removedOrientation])));
    });
    setTasks((current) => current.filter((task) => task.id !== orientationId));
  }

  function replaceOrientationWithRandom(day, orientation, slot) {
    const release = releases.find((item) => item.id === day.releaseId) || day.release;
    if (!release || !orientation?.id) return;

    const artist = artists.find((item) => item.id === (orientation.artistId || release.artistId)) || day.artist;
    const offset = typeof day.offset === 'number' ? day.offset : diffInDays(day.date, release.releaseDate || day.date);
    const releaseDate = release.releaseDate || formatDateInput(addDays(day.date, -offset));
    const releaseForGeneration = { ...release, releaseDate };
    const actionNumber = slot + 1;
    const dayCompleted = Boolean(dayCompletions[getDayKey(release.id, day.date)] || day.completed);
    const manualWarning = Boolean(orientation.manuallyEdited || orientation.templateId === 'custom' || !orientation.generatedPlan);
    const completedWarning = dayCompleted || isOrientationCompleted(orientation);
    const message = [
      `Trocar somente a Ação ${actionNumber} deste dia?`,
      'As outras ações do dia, outros dias, capa, links e checklist serão mantidos.',
      completedWarning ? 'Este dia/ação está marcado como concluído. A conclusão será mantida, mas o texto da ação será substituído.' : '',
      manualWarning ? 'Se você editou esta sugestão manualmente, o texto atual será perdido.' : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    if (!window.confirm(message)) return;

    const seed = Date.now() + Math.floor(Math.random() * 100000);
    const nextAction = generateRandomActionForDay({
      release: releaseForGeneration,
      artist,
      offset,
      slot,
      existingActions: day.orientations,
      seed,
    });

    if (!nextAction) return;

    setTasks((current) =>
      current.map((task) =>
        task.id === orientation.id
          ? {
              ...task,
              ...nextAction,
              id: task.id,
              date: task.date || nextAction.date,
              offset: typeof task.offset === 'number' ? task.offset : nextAction.offset,
              status: task.status || nextAction.status,
              note: task.note || '',
              generatedPlan: true,
              templateId: 'random-plan',
              manuallyEdited: false,
            }
          : task,
      ),
    );
  }

  function generateRandomPlanForRelease(releaseId) {
    const release = releases.find((item) => item.id === releaseId);
    if (!release) return;
    if (!window.confirm('Gerar novas sugestões IA e substituir as orientações atuais deste lançamento?')) return;

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
    if (!window.confirm('Limpar as sugestões IA deste lançamento?')) return;
    const removedTasks = tasks.filter(
      (task) => task.releaseId === releaseId && (task.templateId === 'random-plan' || task.generatedPlan),
    );
    const removedCompletions = selectCompletionKeys(dayCompletions, [releaseId]);
    registerDeletionUndo(`Estratégia de "${release.songTitle || 'lançamento'}"`, () => {
      setReleases((current) => current.map((item) => (item.id === releaseId ? release : item)));
      setTasks((current) => sortByDate(restoreMissingItems(current, removedTasks)));
      setDayCompletions((current) => ({ ...removedCompletions, ...current }));
    });

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
      const nextTasks = releases.flatMap((release) => {
        const existingForRelease = current.filter((task) => task.releaseId === release.id);
        if (hasRandomPlan(release, existingForRelease)) {
          const artist = artists.find((item) => item.id === release.artistId);
          return generateRandomActionsForRelease(release, artist, release.randomPlanSeed || Date.now());
        }

        return generateTasksForRelease(release, existingForRelease);
      });
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
    setPitching([]);
    setPitchBriefs({});
    setPitchChecklists({});
    setBriefings([]);
    setReports([]);
    setActivePage('dashboard');
  }

  function clearData() {
    const target = auth.configured ? 'da sua conta em nuvem e deste navegador' : 'salvos neste navegador';
    if (!window.confirm(`Apagar artistas, lançamentos e orientações ${target}?`)) return;
    const removedWorkspace = { artists, releases, tasks, dayCompletions, pitching, pitchBriefs, pitchChecklists, briefings, reports };
    registerDeletionUndo('Dados do painel', () => {
      setArtists((current) => restoreMissingItems(current, removedWorkspace.artists));
      setReleases((current) => sortByDate(restoreMissingItems(current, removedWorkspace.releases)));
      setTasks((current) => sortByDate(restoreMissingItems(current, removedWorkspace.tasks)));
      setDayCompletions((current) => ({ ...removedWorkspace.dayCompletions, ...current }));
      setPitching((current) => restoreMissingItems(current, removedWorkspace.pitching, true));
      setPitchBriefs((current) => ({ ...removedWorkspace.pitchBriefs, ...current }));
      setPitchChecklists((current) => ({ ...removedWorkspace.pitchChecklists, ...current }));
      setBriefings((current) => restoreMissingItems(current, removedWorkspace.briefings, true));
      setReports((current) => restoreMissingItems(current, removedWorkspace.reports, true));
    });
    setArtists([]);
    setReleases([]);
    setTasks([]);
    setDayCompletions({});
    setPitching([]);
    setPitchBriefs({});
    setPitchChecklists({});
    setBriefings([]);
    setReports([]);
    setActivePage('dashboard');
  }


  function savePitchVersion(version) {
    const normalized = {
      ...version,
      id: version.id || createId('pitch'),
      characterCount: String(version.text || '').length,
      createdAt: version.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPitching((current) => [normalized, ...current]);
  }

  function updatePitchVersion(versionId, patch) {
    setPitching((current) =>
      current.map((item) =>
        item.id === versionId
          ? {
              ...item,
              ...patch,
              id: versionId,
              characterCount: String(patch.text ?? item.text ?? '').length,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }

  function deletePitchVersion(versionId) {
    if (!window.confirm('Excluir esta versão de pitch?')) return;
    const removedVersion = pitching.find((item) => item.id === versionId);
    if (!removedVersion) return;
    registerDeletionUndo(`Pitch "${removedVersion.title || removedVersion.type || 'salvo'}"`, () => {
      setPitching((current) => restoreMissingItems(current, [removedVersion], true));
    });
    setPitching((current) => current.filter((item) => item.id !== versionId));
  }

  function savePitchBrief(key, patch) {
    setPitchBriefs((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function setPitchChecklistItem(key, itemId, checked) {
    setPitchChecklists((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [itemId]: checked,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function saveBriefingVersion(briefing) {
    const normalized = {
      ...briefing,
      id: briefing.id || createId('briefing'),
      createdAt: briefing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBriefings((current) => [normalized, ...current]);
  }

  function updateBriefingVersion(briefingId, patch) {
    setBriefings((current) =>
      current.map((item) => (item.id === briefingId ? { ...item, ...patch, id: briefingId, updatedAt: new Date().toISOString() } : item)),
    );
  }

  function deleteBriefingVersion(briefingId) {
    if (!window.confirm('Excluir este briefing?')) return;
    const removedBriefing = briefings.find((item) => item.id === briefingId);
    if (!removedBriefing) return;
    registerDeletionUndo(`Briefing "${removedBriefing.title || 'salvo'}"`, () => {
      setBriefings((current) => restoreMissingItems(current, [removedBriefing], true));
    });
    setBriefings((current) => current.filter((item) => item.id !== briefingId));
  }

  function saveReportVersion(report) {
    const normalized = {
      ...report,
      id: report.id || createId('report'),
      createdAt: report.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReports((current) => [normalized, ...current]);
  }

  function updateReportVersion(reportId, patch) {
    setReports((current) =>
      current.map((item) => (item.id === reportId ? { ...item, ...patch, id: reportId, updatedAt: new Date().toISOString() } : item)),
    );
  }

  function deleteReportVersion(reportId) {
    if (!window.confirm('Excluir este relatorio?')) return;
    const removedReport = reports.find((item) => item.id === reportId);
    if (!removedReport) return;
    registerDeletionUndo(`Relatório "${removedReport.title || 'salvo'}"`, () => {
      setReports((current) => restoreMissingItems(current, [removedReport], true));
    });
    setReports((current) => current.filter((item) => item.id !== reportId));
  }
  function deleteFinanceItem(releaseId, collection, itemId) {
    const release = releases.find((item) => item.id === releaseId);
    const finance = release?.finance || {};
    const currentItems = Array.isArray(finance[collection]) ? finance[collection] : [];
    const removedItem = currentItems.find((item) => item.id === itemId);
    if (!release || !removedItem) return;

    const itemType = collection === 'expenses' ? 'Despesa' : 'Receita';
    registerDeletionUndo(`${itemType} "${removedItem.description || 'sem descrição'}"`, () => {
      setReleases((current) =>
        current.map((item) => {
          if (item.id !== releaseId) return item;
          const currentFinance = item.finance || {};
          const items = Array.isArray(currentFinance[collection]) ? currentFinance[collection] : [];
          return {
            ...item,
            finance: {
              ...currentFinance,
              [collection]: restoreMissingItems(items, [removedItem], true),
              updatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    });

    patchRelease(releaseId, {
      finance: {
        ...finance,
        [collection]: currentItems.filter((item) => item.id !== itemId),
        updatedAt: new Date().toISOString(),
      },
    });
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
    pitching,
    pitchBriefs,
    pitchChecklists,
    briefings,
    reports,
  };

  const dayActions = {
    onSetDayCompleted: setDayCompleted,
    onUpdateOrientation: updateOrientation,
    onAddOrientation: addOrientation,
    onDeleteOrientation: deleteOrientation,
    onRegenerateOrientation: replaceOrientationWithRandom,
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
    artistView: (
      <ArtistViewPage
        {...commonProps}
        onSetDayCompleted={setDayCompleted}
        onSetPitchChecklist={setPitchChecklistItem}
        onNavigate={setActivePage}
      />
    ),
    diagnosis: (
      <DiagnosisPage
        {...commonProps}
        onPatchRelease={patchRelease}
        onNavigate={setActivePage}
      />
    ),
    generalCalendar: (
      <GeneralCalendarPage
        {...commonProps}
        {...dayActions}
        onNavigate={setActivePage}
      />
    ),
    briefings: (
      <BriefingsPage
        {...commonProps}
        onSaveBriefing={saveBriefingVersion}
        onUpdateBriefing={updateBriefingVersion}
        onDeleteBriefing={deleteBriefingVersion}
      />
    ),
    finance: (
      <FinancePage
        {...commonProps}
        onPatchRelease={patchRelease}
        onDeleteFinanceItem={deleteFinanceItem}
        onNavigate={setActivePage}
      />
    ),
    compare: (
      <ComparePage
        {...commonProps}
        onNavigate={setActivePage}
      />
    ),
    reports: (
      <ReportsPage
        {...commonProps}
        onSaveReport={saveReportVersion}
        onUpdateReport={updateReportVersion}
        onDeleteReport={deleteReportVersion}
        onNavigate={setActivePage}
      />
    ),
    pitching: (
      <PitchingPage
        {...commonProps}
        onSavePitch={savePitchVersion}
        onUpdatePitch={updatePitchVersion}
        onDeletePitch={deletePitchVersion}
        onSaveBrief={savePitchBrief}
        onSetPitchChecklist={setPitchChecklistItem}
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
        onResendConfirmation={auth.resendSignupConfirmation}
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
      <div className="global-undo-control no-print">
        <button
          className="global-undo-button"
          disabled={!undoHistory.length}
          onClick={undoLastDeletion}
          type="button"
          aria-label={undoHistory.length ? `Desfazer exclusão: ${undoHistory.at(-1).label}` : 'Nenhuma exclusão para desfazer'}
          title={undoHistory.length ? `Desfazer: ${undoHistory.at(-1).label}` : 'Nenhuma exclusão para desfazer'}
        >
          <Undo2 size={21} />
          {undoHistory.length > 1 && <span className="global-undo-count">{undoHistory.length}</span>}
        </button>
        {undoNotice && <div className="global-undo-notice" role="status">{undoNotice}</div>}
      </div>
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
