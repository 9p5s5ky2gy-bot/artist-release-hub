import { addDays, diffInDays, formatDateInput, parseLocalDate, todayInput } from './date.js';
import { getPitchKey } from './pitching.js';
import { getReleaseCover, getReleaseType } from './release.js';

export const deadlineDefinitions = [
  { id: 'musicUploaded', label: 'Subir música na distribuidora/plataformas', defaultDays: 40, target: 'releases', action: 'Confirme o envio à distribuidora e registre o status no checklist.' },
  { id: 'pitching', label: 'Fazer pitching', defaultDays: 40, target: 'pitching', action: 'Abra a aba Pitching e gere o pitch para Spotify e distribuidora.' },
  { id: 'coverReady', label: 'Preparar capa', defaultDays: 35, target: 'releases', action: 'Finalize e cadastre a capa no lançamento.' },
  { id: 'masterReady', label: 'Finalizar master', defaultDays: 40, target: 'releases', action: 'Confirme a master final e marque este prazo como concluído.' },
  { id: 'presaveCreated', label: 'Criar pré-save', defaultDays: 30, target: 'releases', action: 'Cadastre o link de pré-save no lançamento.' },
  { id: 'preheating', label: 'Começar pré-aquecimento', defaultDays: 21, target: 'calendar', action: 'Abra a estratégia e inicie as primeiras ações de contexto e estética.' },
  { id: 'warming', label: 'Iniciar aquecimento', defaultDays: 14, target: 'calendar', action: 'Inicie a fase de aquecimento e aumente a frequência de conteúdo.' },
  { id: 'presavePromotion', label: 'Divulgar pré-save', defaultDays: 14, target: 'calendar', action: 'Publique o link e explique o CTA de pré-save nas redes.' },
  { id: 'announcement', label: 'Anunciar data/capa oficialmente', defaultDays: 7, target: 'calendar', action: 'Prepare o anúncio oficial com data, capa e chamada clara.' },
  { id: 'postsPrepared', label: 'Preparar posts do lançamento', defaultDays: 7, target: 'calendar', action: 'Revise os posts, vídeos curtos, stories e legendas da semana final.' },
  { id: 'clipReady', label: 'Preparar clipe/visualizer', defaultDays: 20, target: 'reports', action: 'Finalize o audiovisual ou abra o relatório de branding do clipe.' },
  { id: 'clipScheduled', label: 'Agendar clipe no YouTube', defaultDays: 3, target: 'releases', action: 'Faça o upload, agende a estreia e salve o link do YouTube.' },
  { id: 'bioLink', label: 'Atualizar link da bio', defaultDays: 1, target: 'links', action: 'Atualize e teste o link principal da bio.' },
  { id: 'finalChecklist', label: 'Revisar checklist final', defaultDays: 1, target: 'tasks', action: 'Revise capa, links, pitch, posts e materiais antes do lançamento.' },
];

export const deadlineStatusLabels = {
  overdue: 'Atrasado',
  attention: 'Atenção: prazo chegando',
  on_track: 'Em dia',
  done: 'Concluído',
  not_applicable: 'Não se aplica',
  no_date: 'Data não informada',
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function truthy(value) {
  if (typeof value === 'boolean') return value;
  return ['sim', 'true', 'feito', 'concluido', 'done', 'completed', 'enviado', 'distribuido', 'finalizado', 'pronto', 'agendado'].includes(normalize(value));
}

function validDate(value) {
  const parsed = parseLocalDate(value);
  return Boolean(/^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && parsed && !Number.isNaN(parsed.getTime()));
}

function normalizeManualStatus(value) {
  const status = normalize(value?.status ?? value);
  if (['done', 'feito', 'concluido', 'completed'].includes(status)) return 'done';
  if (['not_applicable', 'nao se aplica', 'n/a'].includes(status)) return 'not_applicable';
  return 'pending';
}

function isClipActive(release, pitchBrief) {
  const clipStatus = normalize(pitchBrief?.hasClip || release.hasClip);
  return ['sim', 'true', 'ativo'].includes(clipStatus) || Boolean(release.clipDate || release.clipUrl || release.clipLink) || normalize(getReleaseType(release)) === 'clipe';
}

function dayContains(day, pattern) {
  const content = (day.orientations || []).map((action) => `${action.title || ''} ${action.description || ''} ${action.type || ''}`).join(' ');
  return pattern.test(normalize(content));
}

function getAutomaticChecks({ artist, release, planDays, pitching, pitchChecklists, pitchBrief }) {
  const releaseDays = planDays.filter((day) => day.releaseId === release.id);
  const pitchKey = getPitchKey(release.artistId, release.id);
  const checklist = pitchChecklists?.[pitchKey] || {};
  const releasePitches = pitching.filter((pitch) => pitch.artistId === release.artistId && pitch.releaseId === release.id);
  const hasClip = isClipActive(release, pitchBrief);
  const checklistDone = Object.entries(checklist).filter(([key, value]) => key !== 'updatedAt' && Boolean(value)).length;
  const distributionStatus = normalize(release.distributionStatus || release.distributorStatus);
  const masterStatus = normalize(release.masterStatus);

  return {
    hasClip,
    checks: {
      musicUploaded: Boolean(checklist.distributed || truthy(release.musicUploaded) || truthy(release.distributed) || truthy(release.distributionSent) || /enviado|distribuido|aprovado/.test(distributionStatus)),
      pitching: Boolean(releasePitches.some((pitch) => ['spotify', 'distributor'].includes(pitch.type)) || checklist.spotifyPitch || checklist.distributorPitch),
      coverReady: Boolean(getReleaseCover(release) || checklist.cover),
      masterReady: Boolean(truthy(release.masterReady) || truthy(release.mastered) || /pronto|final|aprovado/.test(masterStatus) || release.masterLink),
      presaveCreated: Boolean(release.presaveLink || release.presaveUrl || checklist.presave),
      preheating: releaseDays.some((day) => Number(day.offset) <= -21 && day.completed),
      warming: releaseDays.some((day) => Number(day.offset) <= -14 && Number(day.offset) > -21 && day.completed),
      presavePromotion: releaseDays.some((day) => day.completed && dayContains(day, /pre-save|presave/)),
      announcement: releaseDays.some((day) => day.completed && dayContains(day, /anuncio|anunciar|data|capa/)),
      postsPrepared: Boolean(checklist.artistViewPostsPrepared || releaseDays.some((day) => (day.orientations || []).length > 0)),
      clipReady: Boolean(checklist.clip || truthy(release.clipReady) || release.clipUrl || release.clipLink || release.youtubeLink),
      clipScheduled: Boolean(truthy(release.clipScheduled) || (release.clipDate && (release.clipUrl || release.youtubeLink))),
      bioLink: Boolean(checklist.artistViewBioLink || release.bioLink || release.linkInBio || release.smartLink || artist.bioLink || artist.linkInBio || artist.smartLink),
      finalChecklist: Boolean(truthy(release.finalChecklist) || checklist.finalChecklist || checklistDone >= 12),
    },
  };
}

export function getDeadlineSettings(release = {}) {
  const saved = release.deadlineSettings && typeof release.deadlineSettings === 'object' ? release.deadlineSettings : {};
  return Object.fromEntries(deadlineDefinitions.map((definition) => {
    const numeric = Number(saved[definition.id]);
    return [definition.id, Number.isFinite(numeric) && numeric >= 0 && numeric <= 180 ? Math.round(numeric) : definition.defaultDays];
  }));
}

function getDaysLabel(status, daysUntilDue) {
  if (status === 'done') return 'Tarefa concluída';
  if (status === 'not_applicable') return 'Este prazo não se aplica';
  if (status === 'no_date') return 'Defina a data do lançamento';
  if (daysUntilDue === 0) return 'Prazo termina hoje';
  if (daysUntilDue < 0) return `Atrasado há ${Math.abs(daysUntilDue)} dia(s)`;
  return `Faltam ${daysUntilDue} dia(s)`;
}

function getMainAlert(release, alerts, today) {
  if (!validDate(release.releaseDate)) return 'Defina a data do lançamento para calcular os prazos.';
  const daysToRelease = diffInDays(release.releaseDate, today);
  if (daysToRelease < 0) return 'Lançamento já realizado. Foque em pós-lançamento, relatórios, clipe, playlists de usuários e métricas.';
  if (daysToRelease >= 40) return 'Você ainda está em tempo ideal para subir a música e preparar o pitching.';
  const overdue = alerts.find((alert) => alert.status === 'overdue');
  if (overdue) return `Urgente: o prazo ideal para "${overdue.label}" já passou. ${overdue.action}`;
  const attention = alerts.find((alert) => alert.status === 'attention');
  if (attention) return `Atenção: ${attention.daysLabel.toLowerCase()} para "${attention.label}". ${attention.action}`;
  return `Faltam ${daysToRelease} dia(s) para o lançamento. Revise os próximos prazos e conclua primeiro as ações de maior prioridade.`;
}

export function buildReleaseDeadlineAlerts({
  artist = {},
  release = {},
  planDays = [],
  pitching = [],
  pitchChecklists = {},
  pitchBrief = {},
  today = todayInput(),
}) {
  const settings = getDeadlineSettings(release);
  const manualChecklist = release.deadlineChecklist && typeof release.deadlineChecklist === 'object' ? release.deadlineChecklist : {};
  const automatic = getAutomaticChecks({ artist, release, planDays, pitching, pitchChecklists, pitchBrief });
  const hasDate = validDate(release.releaseDate);

  const alerts = deadlineDefinitions.map((definition) => {
    const manualStatus = normalizeManualStatus(manualChecklist[definition.id]);
    const clipDeadline = ['clipReady', 'clipScheduled'].includes(definition.id);
    const applicable = !clipDeadline || automatic.hasClip;
    const detected = Boolean(automatic.checks[definition.id]);
    const done = manualStatus === 'done' || detected;
    const notApplicable = manualStatus === 'not_applicable' || !applicable;
    const daysBefore = settings[definition.id];
    const dueDate = hasDate ? formatDateInput(addDays(release.releaseDate, -daysBefore)) : '';
    const daysUntilDue = dueDate ? diffInDays(dueDate, today) : null;
    let status = 'on_track';
    if (notApplicable) status = 'not_applicable';
    else if (done) status = 'done';
    else if (!hasDate) status = 'no_date';
    else if (daysUntilDue < 0) status = 'overdue';
    else if (daysUntilDue <= 7) status = 'attention';

    return {
      ...definition,
      daysBefore,
      dueDate,
      daysUntilDue,
      status,
      statusLabel: deadlineStatusLabels[status],
      daysLabel: getDaysLabel(status, daysUntilDue),
      priority: status === 'overdue' ? 'alta' : status === 'attention' ? 'média' : status === 'on_track' ? 'baixa' : 'concluída',
      manualStatus,
      detected,
      applicable,
    };
  });

  const counts = alerts.reduce((summary, alert) => ({ ...summary, [alert.status]: (summary[alert.status] || 0) + 1 }), {});
  return {
    alerts,
    settings,
    counts,
    mainAlert: getMainAlert(release, alerts, today),
    daysToRelease: hasDate ? diffInDays(release.releaseDate, today) : null,
    hasDate,
  };
}

export function applyDeadlineScorePenalties(categoryScores, alerts = []) {
  const next = { ...categoryScores };
  const overdueIds = new Set(alerts.filter((alert) => alert.status === 'overdue').map((alert) => alert.id));
  const subtract = (category, amount) => { next[category] = Math.max(0, Math.round((next[category] || 0) - amount)); };

  if (overdueIds.has('pitching')) subtract('pitching', 20);
  if (overdueIds.has('musicUploaded')) subtract('distribution', 18);
  if (overdueIds.has('masterReady')) subtract('distribution', 12);
  if (overdueIds.has('coverReady')) subtract('basics', 15);
  if (overdueIds.has('presaveCreated') || overdueIds.has('presavePromotion')) subtract('distribution', 12);
  if (overdueIds.has('preheating') || overdueIds.has('warming')) subtract('strategy', 10);
  if (overdueIds.has('announcement') || overdueIds.has('postsPrepared')) subtract('content', 12);
  if (overdueIds.has('clipReady') || overdueIds.has('clipScheduled')) subtract('content', 8);
  if (overdueIds.has('bioLink') || overdueIds.has('finalChecklist')) subtract('links', 8);

  return next;
}
