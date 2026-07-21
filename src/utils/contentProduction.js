const productionFormats = [
  { id: 'videos', label: 'Vídeos / Shorts' },
  { id: 'reels', label: 'Reels' },
  { id: 'tiktoks', label: 'TikToks' },
  { id: 'stories', label: 'Stories' },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/[*#_`~>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyProductionAction(action = {}) {
  const type = normalizeText(action.type || action.format);
  const title = normalizeText(action.title);

  if (type.includes('story')) return 'stories';
  if (type.includes('reels') || type === 'reel') return 'reels';
  if (type.includes('tiktok')) return 'tiktoks';
  if (type.includes('short') || type.includes('video') || type.includes('clipe') || type.includes('visualizer') || type.includes('bastidor')) return 'videos';

  if (/\b(video|clipe|visualizer|shorts?|performance|bastidor|making of)\b/.test(title)) return 'videos';
  return '';
}

function getReleaseActions(releaseId, planDays = [], tasks = []) {
  const releaseDays = planDays.filter((day) => day.releaseId === releaseId);
  const fromDays = releaseDays.flatMap((day) =>
    (Array.isArray(day.orientations) ? day.orientations : []).map((action) => ({
      ...action,
      date: action.date || day.date,
      phase: action.phase || day.phase,
    })),
  );
  const source = fromDays.length ? fromDays : tasks.filter((task) => task.releaseId === releaseId);
  const seen = new Set();

  return source.filter((action, index) => {
    const key = action.id || `${action.date || ''}:${action.title || ''}:${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildContentProductionSummary({ releaseId, planDays = [], tasks = [] }) {
  const groups = Object.fromEntries(productionFormats.map((format) => [format.id, []]));

  getReleaseActions(releaseId, planDays, tasks).forEach((action) => {
    const format = classifyProductionAction(action);
    const title = cleanTitle(action.title);
    if (!format || !title) return;
    groups[format].push({
      id: action.id || `${format}:${groups[format].length}`,
      title,
    });
  });

  const formats = productionFormats.map((format) => ({
    ...format,
    count: groups[format.id].length,
    themes: groups[format.id],
  }));

  return {
    formats,
    total: formats.reduce((sum, format) => sum + format.count, 0),
  };
}

