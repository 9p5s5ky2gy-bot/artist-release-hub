import { addDays, diffInDays, formatDateInput } from './date';
import { calendarTemplate } from '../data/calendarTemplate';

export const MAX_PLAN_DAYS = 31;

export function generateTasksForRelease(release, existingTasks = []) {
  if (!release?.id || !release?.releaseDate) return [];

  const generated = calendarTemplate.map((template) => {
    const existing = existingTasks.find((task) => task.id === `${release.id}-${template.id}`);
    const suggestedLink = template.linkField ? release[template.linkField] || '' : '';

    return {
      id: `${release.id}-${template.id}`,
      templateId: template.id,
      releaseId: release.id,
      artistId: release.artistId,
      title: existing?.title || template.title,
      description: existing?.description || template.description,
      type: template.type,
      date: formatDateInput(addDays(release.releaseDate, template.offset)),
      status: existing?.status || 'não concluído',
      priority: existing?.priority || template.priority || 'média',
      note: existing?.note || '',
      link: existing?.link || suggestedLink,
      offset: template.offset,
    };
  });

  const generatedIds = new Set(generated.map((task) => task.id));
  const customOrientations = existingTasks.filter((task) => task.templateId === 'custom' || !generatedIds.has(task.id));

  return [...generated, ...customOrientations].filter((task) => task.title?.trim());
}

export function groupTasksByDate(tasks) {
  return tasks.reduce((groups, task) => {
    if (!groups[task.date]) groups[task.date] = [];
    groups[task.date].push(task);
    return groups;
  }, {});
}

export function getDayKey(releaseId, date) {
  return `${releaseId}:${date}`;
}

export function getPlanPhase(offset) {
  if (offset === 0) return 'Lançamento';
  if (offset > 0) return 'Pós-lançamento';
  if (offset >= -7) return 'Semana final';
  if (offset >= -14) return 'Pré-save';
  return 'Aquecimento';
}

export function getReleaseRelation(offset) {
  if (offset === 0) return 'Dia do lançamento';
  if (offset < 0) return `${Math.abs(offset)} dias antes do lançamento`;
  return `${offset} dias depois do lançamento`;
}

export function buildPlanDays(tasks, releases, artists, dayCompletions = {}) {
  const releaseMap = new Map(releases.map((release) => [release.id, release]));
  const artistMap = new Map(artists.map((artist) => [artist.id, artist]));

  const grouped = tasks.reduce((days, task) => {
    const release = releaseMap.get(task.releaseId);
    if (!release || !task.date) return days;

    const key = getDayKey(task.releaseId, task.date);
    if (!days[key]) {
      const offset = typeof task.offset === 'number' ? task.offset : diffInDays(task.date, release.releaseDate);
      days[key] = {
        key,
        releaseId: task.releaseId,
        artistId: task.artistId || release.artistId,
        date: task.date,
        offset,
        release,
        artist: artistMap.get(task.artistId || release.artistId),
        phase: getPlanPhase(offset),
        relation: getReleaseRelation(offset),
        completed: Boolean(dayCompletions[key]),
        orientations: [],
      };
    }
    days[key].orientations.push(task);
    return days;
  }, {});

  const allDays = Object.values(grouped).map((day) => ({
    ...day,
    orientations: day.orientations.sort((a, b) => {
      if ((a.offset ?? 0) !== (b.offset ?? 0)) return (a.offset ?? 0) - (b.offset ?? 0);
      return String(a.templateId || a.id).localeCompare(String(b.templateId || b.id));
    }),
  }));

  const daysByRelease = allDays.reduce((groups, day) => {
    if (!groups[day.releaseId]) groups[day.releaseId] = [];
    groups[day.releaseId].push(day);
    return groups;
  }, {});

  Object.values(daysByRelease).forEach((releaseDays) => {
    releaseDays
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, MAX_PLAN_DAYS)
      .forEach((day, index) => {
        day.dayNumber = index + 1;
      });
  });

  return Object.values(daysByRelease)
    .flatMap((releaseDays) => releaseDays.sort((a, b) => a.date.localeCompare(b.date)).slice(0, MAX_PLAN_DAYS))
    .sort((a, b) => {
      const dateOrder = a.date.localeCompare(b.date);
      if (dateOrder !== 0) return dateOrder;
      return a.release.songTitle.localeCompare(b.release.songTitle);
    });
}

export function getReleaseProgress(releaseId, planDays) {
  const releaseDays = planDays.filter((day) => day.releaseId === releaseId);
  const completedDays = releaseDays.filter((day) => day.completed).length;
  const totalDays = releaseDays.length;
  return {
    completedDays,
    totalDays,
    remainingDays: Math.max(totalDays - completedDays, 0),
    percent: totalDays ? Math.round((completedDays / totalDays) * 100) : 0,
  };
}
