
import { addDays, diffInDays, formatDateInput, formatFullDate, formatHumanDate, todayInput } from './date';
import { getPlanPhase, getReleaseProgress } from './calendar';
import { getReleaseCover, getReleaseType } from './release';
import { buildPitchContext, getDefaultBrief, getPitchKey, scorePitchQuality, suggestPlaylists } from './pitching';

export const briefingTypes = [
  { id: 'cover', label: 'Briefing de capa' },
  { id: 'photoshoot', label: 'Briefing de ensaio fotografico' },
  { id: 'musicVideo', label: 'Briefing de videoclipe' },
  { id: 'visualizer', label: 'Briefing de visualizer' },
  { id: 'lyricVideo', label: 'Briefing de lyric video' },
  { id: 'reels', label: 'Briefing de edicao de Reels' },
  { id: 'designer', label: 'Briefing para designer' },
  { id: 'filmmaker', label: 'Briefing para filmmaker' },
  { id: 'traffic', label: 'Briefing para campanha de trafego' },
  { id: 'era', label: 'Briefing geral da era visual' },
  { id: 'press', label: 'Briefing para material de imprensa' },
  { id: 'custom', label: 'Briefing personalizado' },
];

export const reportTypes = [
  { id: 'complete', label: 'Relatorio completo' },
  { id: 'clip_branding', label: 'Relatório de Branding para Clipe' },
  { id: 'client', label: 'Relatorio resumido para cliente' },
  { id: 'planning', label: 'Relatorio de planejamento' },
  { id: 'performance', label: 'Relatorio de desempenho' },
  { id: 'financial', label: 'Relatorio financeiro' },
  { id: 'postlaunch', label: 'Relatorio pos-lancamento' },
];

export const defaultExpenseCategories = ['producao musical', 'mixagem', 'masterizacao', 'composicao', 'beat', 'feat', 'capa', 'design', 'fotos', 'ensaio', 'videoclipe', 'visualizer', 'lyric video', 'editor', 'trafego pago', 'playlists', 'influenciadores', 'paginas e blogs', 'assessoria', 'distribuicao', 'transporte', 'locacao', 'figurino', 'maquiagem', 'equipe', 'alimentacao', 'outros'];
export const defaultRevenueCategories = ['streams', 'shows', 'vendas', 'merch', 'publicidade', 'direitos autorais', 'distribuicao', 'parcerias', 'outras receitas'];
export const financeExpenseStatuses = ['planejado', 'aprovado', 'contratado', 'pago', 'cancelado'];

const linkFields = [['presaveLink', 'Pre-save'], ['spotifyLink', 'Spotify'], ['youtubeLink', 'YouTube'], ['tiktokLink', 'TikTok'], ['instagramLink', 'Instagram'], ['driveLink', 'Drive'], ['canvaLink', 'Canva'], ['musicLink', 'Musica'], ['clipLink', 'Clipe'], ['bioLink', 'Link na bio']];

export function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return String(value || '').trim().length > 0;
}

export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const clean = String(value || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseMoney(value));
}

export function getReleaseMetrics(release = {}) {
  return release.metrics || release.performance || release.results || {};
}

export function getReleaseFinance(release = {}) {
  const finance = release.finance && typeof release.finance === 'object' ? release.finance : {};
  return {
    plannedBudget: parseMoney(finance.plannedBudget),
    estimatedRevenue: parseMoney(finance.estimatedRevenue),
    notes: finance.notes || '',
    expenses: Array.isArray(finance.expenses) ? finance.expenses : [],
    revenues: Array.isArray(finance.revenues) ? finance.revenues : [],
    updatedAt: finance.updatedAt || '',
  };
}

export function summarizeFinance(release = {}) {
  const finance = getReleaseFinance(release);
  const totalPlanned = finance.expenses.reduce((sum, item) => sum + parseMoney(item.plannedValue), 0);
  const totalSpent = finance.expenses.reduce((sum, item) => sum + parseMoney(item.realValue), 0);
  const totalPending = finance.expenses.filter((item) => item.status !== 'pago' && item.paid !== true).reduce((sum, item) => sum + parseMoney(item.realValue || item.plannedValue), 0);
  const totalRevenue = finance.revenues.reduce((sum, item) => sum + parseMoney(item.value), 0);
  const budget = finance.plannedBudget || totalPlanned;
  const byCategory = finance.expenses.reduce((map, item) => {
    const key = item.category || 'outros';
    map[key] = (map[key] || 0) + parseMoney(item.realValue || item.plannedValue);
    return map;
  }, {});
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  return { ...finance, budget, totalPlanned, totalSpent, totalPending, totalRevenue, result: totalRevenue - totalSpent, usedPercent: budget ? clampScore((totalSpent / budget) * 100) : 0, remaining: budget ? budget - totalSpent : 0, byCategory, topCategory: topCategory ? { name: topCategory[0], value: topCategory[1] } : null };
}
export function getPrimaryPitch({ pitching = [], artistId, releaseId }) {
  const versions = pitching.filter((item) => item.artistId === artistId && item.releaseId === releaseId).sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  const priority = ['spotify', 'distributor', 'short', 'curator', 'blog', 'email'];
  return priority.map((type) => versions.find((item) => item.type === type)).find(Boolean) || versions[0] || null;
}

export function getReleaseLinks(artist = {}, release = {}) {
  const releaseLinks = linkFields.map(([field, label]) => ({ label, href: release[field] })).filter((item) => hasValue(item.href));
  const artistLinks = [['spotify', 'Spotify do artista'], ['instagram', 'Instagram do artista'], ['tiktok', 'TikTok do artista'], ['youtube', 'YouTube do artista'], ['email', 'E-mail']].map(([field, label]) => ({ label, href: artist[field] })).filter((item) => hasValue(item.href));
  const customLinks = String(release.customLinks || release.otherLinks || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [label, href] = line.split('|').map((part) => part?.trim());
    return { label: label || 'Link personalizado', href: href || line };
  });
  return [...releaseLinks, ...artistLinks, ...customLinks];
}

function scoreChecklist(items) {
  const total = items.length || 1;
  const done = items.filter((item) => item.ok).length;
  return clampScore((done / total) * 100);
}

function countPhase(planDays, releaseId, predicate) {
  return planDays.filter((day) => day.releaseId === releaseId && predicate(day)).length;
}

function getPitchChecklistDone(pitchChecklists, artistId, releaseId) {
  const checklist = pitchChecklists?.[getPitchKey(artistId, releaseId)] || {};
  return Object.values(checklist).filter(Boolean).length;
}

export function getDiagnosisStatus(score) {
  if (score < 30) return 'Lancamento em risco';
  if (score < 50) return 'Preparacao inicial';
  if (score < 70) return 'Em desenvolvimento';
  if (score < 85) return 'Bem preparado';
  return 'Pronto para executar';
}

export function analyzeRelease({ artist = {}, release = {}, planDays = [], tasks = [], pitching = [], pitchChecklists = {} }) {
  const releaseDays = planDays.filter((day) => day.releaseId === release.id);
  const releaseTasks = tasks.filter((task) => task.releaseId === release.id);
  const progress = getReleaseProgress(release.id, planDays);
  const today = todayInput();
  const overdueDays = releaseDays.filter((day) => day.date < today && !day.completed).length;
  const finance = summarizeFinance(release);
  const pitch = getPrimaryPitch({ pitching, artistId: release.artistId, releaseId: release.id });
  const pitchContext = buildPitchContext(artist, release, getDefaultBrief(artist, release));
  const pitchScore = pitch ? scorePitchQuality(pitchContext, pitch).score : 0;
  const links = getReleaseLinks(artist, release);
  const futureOffset = release.releaseDate ? diffInDays(release.releaseDate, today) : 999;
  const hasPresave = hasValue(release.presaveLink) || normalizeText(release.presaveActive) === 'sim';
  const hasClip = normalizeText(release.hasClip) === 'sim' || hasValue(release.clipDate) || getReleaseType(release) === 'Clipe';
  const categories = {
    basics: scoreChecklist([{ ok: hasValue(release.songTitle) }, { ok: hasValue(release.artistId) }, { ok: hasValue(getReleaseType(release)) }, { ok: hasValue(release.releaseDate) }, { ok: hasValue(release.releaseGenre || release.genre || artist.genre) }, { ok: hasValue(release.mood) }, { ok: hasValue(release.narrative || release.description || release.notes) }, { ok: hasValue(getReleaseCover(release)) }, { ok: links.length >= 2 }]),
    strategy: scoreChecklist([{ ok: releaseDays.length >= 21 }, { ok: releaseTasks.length >= 21 }, { ok: countPhase(planDays, release.id, (day) => day.offset < 0) >= 10 }, { ok: countPhase(planDays, release.id, (day) => day.offset === 0) >= 1 }, { ok: countPhase(planDays, release.id, (day) => day.offset > 0) >= 5 }, { ok: release.planMode === 'random' || hasValue(release.randomPlanGeneratedAt) }]),
    content: scoreChecklist([{ ok: releaseTasks.some((task) => normalizeText(task.type).includes('post')) }, { ok: releaseTasks.some((task) => normalizeText(task.type).includes('story')) }, { ok: releaseTasks.some((task) => normalizeText(task.type).includes('reels') || normalizeText(task.type).includes('tiktok')) }, { ok: releaseTasks.some((task) => normalizeText(task.type).includes('bastidor')) }, { ok: releaseTasks.some((task) => normalizeText(task.description).includes('cta')) }]),
    pitching: scoreChecklist([{ ok: pitching.some((item) => item.artistId === release.artistId && item.releaseId === release.id && item.type === 'spotify') }, { ok: pitching.some((item) => item.artistId === release.artistId && item.releaseId === release.id && item.type === 'distributor') }, { ok: pitching.some((item) => item.artistId === release.artistId && item.releaseId === release.id && item.type === 'curator') }, { ok: pitchScore >= 70 }, { ok: getPitchChecklistDone(pitchChecklists, release.artistId, release.id) >= 8 }]),
    distribution: scoreChecklist([{ ok: hasValue(release.presaveDate) || futureOffset <= 14 }, { ok: hasPresave || futureOffset <= 14 }, { ok: hasValue(release.spotifyLink) || futureOffset > 0 }, { ok: hasValue(release.driveLink) || hasValue(release.canvaLink) }, { ok: !hasClip || hasValue(release.clipDate) || hasValue(release.youtubeLink) }]),
    engagement: scoreChecklist([{ ok: releaseTasks.some((task) => normalizeText(task.title + task.description).includes('fa')) }, { ok: releaseTasks.some((task) => normalizeText(task.type).includes('interacao')) }, { ok: hasValue(release.fanActions) || hasValue(artist.editorialLines) }, { ok: releaseTasks.some((task) => normalizeText(task.title + task.description).includes('repost')) }]),
    links: scoreChecklist([{ ok: links.length >= 3 }, { ok: hasValue(release.presaveLink) || futureOffset <= 14 }, { ok: hasValue(release.spotifyLink) || futureOffset > 0 }, { ok: hasValue(release.driveLink) || hasValue(release.canvaLink) }, { ok: hasValue(artist.instagram) || hasValue(artist.tiktok) || hasValue(artist.spotify) }]),
    execution: progress.totalDays ? clampScore(progress.percent - Math.min(35, overdueDays * 4)) : 0,
    postlaunch: scoreChecklist([{ ok: countPhase(planDays, release.id, (day) => day.offset > 0) >= 5 }, { ok: releaseTasks.some((task) => normalizeText(task.type).includes('pos')) }, { ok: releaseTasks.some((task) => normalizeText(task.title + task.description).includes('feedback')) }, { ok: releaseTasks.some((task) => normalizeText(task.title + task.description).includes('repost')) }]),
    budget: scoreChecklist([{ ok: finance.budget > 0 }, { ok: finance.expenses.length > 0 }, { ok: finance.expenses.some((item) => normalizeText(item.category).includes('trafego')) || hasValue(release.trafficBudget) }, { ok: finance.totalSpent <= finance.budget || finance.budget === 0 }]),
  };
  const weights = { basics: 1.1, strategy: 1.15, content: 1, pitching: 0.95, distribution: 0.9, engagement: 0.8, links: 0.8, execution: 1.15, postlaunch: 0.75, budget: 0.6 };
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const score = clampScore(Object.entries(categories).reduce((sum, [key, value]) => sum + value * weights[key], 0) / weightTotal);
  const strengths = [];
  const warnings = [];
  const priorities = [];
  if (categories.strategy >= 75) strengths.push('Estrategia estruturada por fases.');
  if (hasValue(getReleaseCover(release))) strengths.push('Capa cadastrada.');
  if (pitchScore >= 70) strengths.push('Pitch com boa qualidade.');
  if (progress.percent >= 70) strengths.push('Boa execucao do calendario.');
  if (hasPresave) strengths.push('Pre-save configurado.');
  if (links.length >= 3) strengths.push('Links importantes organizados.');
  if (!hasValue(getReleaseCover(release))) warnings.push('Capa ausente.');
  if (!pitch) warnings.push('Pitch ainda nao gerado.');
  if (links.length < 3) warnings.push('Faltam links importantes.');
  if (overdueDays > 0) warnings.push(`${overdueDays} dia(s) do calendario estao atrasados.`);
  if (!hasPresave && futureOffset > 0) warnings.push('Pre-save sem link ou status definido.');
  if (categories.postlaunch < 55) warnings.push('Poucas acoes de pos-lancamento.');
  if (!finance.budget) warnings.push('Orcamento ainda nao definido.');
  if (hasClip && !release.clipDate && !release.youtubeLink) warnings.push('Clipe indicado, mas sem data ou link.');
  const addPriority = (condition, item) => { if (condition) priorities.push(item); };
  addPriority(!pitch, { title: 'Finalizar pitch principal', reason: 'O lancamento ainda nao possui pitch salvo.', impact: 'Melhora a apresentacao para plataformas e curadores.', priority: futureOffset <= 20 ? 'alta' : 'media', target: 'pitching' });
  addPriority(!hasValue(getReleaseCover(release)), { title: 'Cadastrar capa do lancamento', reason: 'A capa e material basico para posts, briefing e pitching.', impact: 'Aumenta clareza visual.', priority: 'alta', target: 'releases' });
  addPriority(overdueDays > 0, { title: 'Resolver dias atrasados', reason: 'Existem dias do plano sem conclusao.', impact: 'Recupera execucao.', priority: 'alta', target: 'generalCalendar' });
  addPriority(!finance.budget, { title: 'Definir orcamento do lancamento', reason: 'Sem orcamento fica dificil avaliar recursos.', impact: 'Ajuda a controlar gastos e retorno.', priority: 'media', target: 'finance' });
  addPriority(categories.postlaunch < 55, { title: 'Fortalecer pos-lancamento', reason: 'A campanha precisa manter a musica viva.', impact: 'Cria novas oportunidades de conteudo.', priority: 'media', target: 'calendar' });
  return { score, status: getDiagnosisStatus(score), categoryScores: categories, strengths: strengths.length ? strengths : ['Base cadastrada para iniciar o plano.'], warnings: warnings.length ? warnings : ['Nenhum ponto critico encontrado.'], priorities: priorities.slice(0, 5), completedItems: progress.completedDays, missingItems: Math.max(progress.totalDays - progress.completedDays, 0), overdueDays, progress, finance, pitch, calculatedAt: new Date().toISOString() };
}

export function buildDiagnosisSnapshot(diagnosis) {
  return { score: diagnosis.score, status: diagnosis.status, categoryScores: diagnosis.categoryScores, strengths: diagnosis.strengths, warnings: diagnosis.warnings, priorities: diagnosis.priorities, calculatedAt: diagnosis.calculatedAt };
}
export function buildGlobalEvents({ artists = [], releases = [], planDays = [], pitching = [], pitchChecklists = {} }) {
  const artistMap = new Map(artists.map((artist) => [artist.id, artist]));
  const events = [];
  planDays.forEach((day) => {
    day.orientations.forEach((orientation, index) => {
      events.push({ id: orientation.id, kind: 'task', date: day.date, title: orientation.title || `Acao ${index + 1}`, description: orientation.description || '', artist: day.artist || artistMap.get(day.artistId), release: day.release, artistId: day.artistId, releaseId: day.releaseId, phase: day.phase, priority: orientation.priority || 'media', type: orientation.type || 'orientacao', status: day.completed ? 'concluido' : 'pendente', completed: day.completed, orientation, day });
    });
  });
  releases.forEach((release) => {
    const artist = artistMap.get(release.artistId);
    if (release.releaseDate) events.push({ id: `${release.id}:release`, kind: 'release', date: release.releaseDate, title: `Lancamento: ${release.songTitle}`, artist, release, artistId: release.artistId, releaseId: release.id, phase: 'Lancamento', priority: 'alta', type: 'marco', status: release.status || 'planejamento' });
    if (release.presaveDate) events.push({ id: `${release.id}:presave`, kind: 'presave', date: release.presaveDate, title: `Inicio do pre-save: ${release.songTitle}`, artist, release, artistId: release.artistId, releaseId: release.id, phase: 'Pre-save', priority: release.presaveLink ? 'media' : 'alta', type: 'pre-save', status: release.presaveLink ? 'preparado' : 'pendente' });
    if (release.clipDate) events.push({ id: `${release.id}:clip`, kind: 'clip', date: release.clipDate, title: `Clipe/visual: ${release.songTitle}`, artist, release, artistId: release.artistId, releaseId: release.id, phase: 'Conteudo visual', priority: 'alta', type: 'clipe', status: 'planejado' });
    const pitchKey = getPitchKey(release.artistId, release.id);
    const hasPitch = pitching.some((item) => item.artistId === release.artistId && item.releaseId === release.id);
    const pitchDue = release.releaseDate ? formatDateInput(addDays(release.releaseDate, -20)) : '';
    if (pitchDue && !hasPitch) events.push({ id: `${release.id}:pitch-due`, kind: 'pitch', date: pitchDue, title: `Prazo de pitch: ${release.songTitle}`, artist, release, artistId: release.artistId, releaseId: release.id, phase: 'Pitching', priority: 'alta', type: 'pitch', status: Object.keys(pitchChecklists[pitchKey] || {}).length ? 'em andamento' : 'pendente' });
  });
  return events.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

export function getArtistColor(index = 0) {
  const colors = ['#65e6ad', '#5fd3ff', '#ffd166', '#ff6b88', '#b692ff', '#ff9f43', '#7bdff2', '#f15bb5'];
  return colors[index % colors.length];
}

export function sectionsToText(title, sections) {
  return [title, '', ...Object.entries(sections).flatMap(([sectionTitle, rows]) => [sectionTitle.toUpperCase(), ...rows.map(([label, value]) => `${label}: ${value || 'Nao informado'}`), ''])].join('\n');
}

export function getBriefingSections({ type, artist = {}, release = {}, planDays = [], extra = '' }) {
  const artistName = artist.stageName || 'Nao informado';
  const releaseTitle = release.songTitle || 'Nao informado';
  const releaseDays = planDays.filter((day) => day.releaseId === release.id);
  const mainAction = releaseDays.find((day) => day.offset <= 0)?.orientations?.[0];
  const base = {
    'Dados principais': [['Artista', artistName], ['Lancamento', releaseTitle], ['Tipo', getReleaseType(release) || 'Nao informado'], ['Data', release.releaseDate ? formatFullDate(release.releaseDate) : 'Nao informado'], ['Genero', release.releaseGenre || release.genre || artist.genre || 'Nao informado'], ['Mood', release.mood || 'Nao informado']],
    'Conceito e narrativa': [['Conceito central', release.narrative || release.description || release.notes || 'Nao informado'], ['Arquetipos', artist.archetype || release.archetypes || 'Nao informado'], ['Linhas editoriais', artist.editorialLines || release.editorialLines || 'Nao informado'], ['Cores', artist.visualColors || release.visualColors || 'Nao informado']],
  };
  const templates = {
    cover: { title: `Briefing de capa - ${artistName} - ${releaseTitle}`, sections: { ...base, 'Direcao visual': [['Sensacao visual', release.mood || artist.archetype || 'Nao informado'], ['Elementos obrigatorios', 'Nome do artista, nome do lancamento e identidade da era.'], ['Elementos proibidos', 'Nao informado'], ['Tipografia desejada', 'Nao informado'], ['Formato', 'Capa 1:1 para distribuicao e recortes para redes.'], ['Prazo', release.releaseDate ? `Antes de ${formatHumanDate(release.releaseDate)}` : 'Nao informado']] } },
    musicVideo: { title: `Briefing de videoclipe - ${artistName} - ${releaseTitle}`, sections: { ...base, 'Clipe': [['Objetivo', 'Traduzir a narrativa da faixa em conteudo visual forte.'], ['Cenas sugeridas', release.narrative || 'Nao informado'], ['Estetica', artist.archetype || release.mood || 'Nao informado'], ['Locacoes', 'Nao informado'], ['Figurino', 'Nao informado'], ['Versoes necessarias', 'Horizontal, vertical, cortes para teaser e Reels.'], ['Cronograma', release.clipDate || release.releaseDate || 'Nao informado'], ['Orcamento', release.finance?.plannedBudget ? formatCurrency(release.finance.plannedBudget) : 'Nao informado']] } },
    reels: { title: `Briefing de Reels - ${artistName} - ${releaseTitle}`, sections: { ...base, 'Roteiro curto': [['Acao relacionada', mainAction?.title || 'Nao informado'], ['Gancho', mainAction?.description || 'Abrir com trecho forte da musica.'], ['Formato', 'Vertical 9:16, curto e direto.'], ['CTA', 'Ouvir, salvar, comentar ou usar o audio.'], ['Estilo de edicao', 'Cortes rapidos, legenda clara e foco no primeiro segundo.'], ['Prazo', mainAction?.date || 'Nao informado']] } },
    traffic: { title: `Briefing de trafego - ${artistName} - ${releaseTitle}`, sections: { ...base, 'Campanha': [['Objetivo', 'Gerar alcance qualificado para o lancamento e direcionar para link principal.'], ['Publico-alvo', release.targetAudience || artist.targetAudience || 'Nao informado'], ['Orcamento', release.trafficBudget || release.finance?.plannedBudget || 'Nao informado'], ['Criativos', 'Capa, trecho principal, bastidor e CTA de pre-save/ouvir agora.'], ['Metrica principal', 'Cliques no link, salvamentos, comentarios e retencao.']] } },
  };
  return templates[type] || { title: `${briefingTypes.find((item) => item.id === type)?.label || 'Briefing'} - ${artistName} - ${releaseTitle}`, sections: { ...base, Entregaveis: [['Objetivo', release.objective || 'Nao informado'], ['Referencias', release.references || 'Nao informado'], ['Prazos', release.releaseDate || 'Nao informado'], ['Links', getReleaseLinks(artist, release).map((link) => `${link.label}: ${link.href}`).join('\n') || 'Nao informado'], ['Observacoes adicionais', extra || 'Nao informado']] } };
}

export function generateBriefing({ type, artist, release, planDays, extra }) {
  const generated = getBriefingSections({ type, artist, release, planDays, extra });
  return { type, title: generated.title, content: sectionsToText(generated.title, generated.sections), sections: generated.sections };
}

export function compareReleaseMetrics({ releases = [], planDays = [], pitching = [] }) {
  const rows = [
    { key: 'date', label: 'Data', get: (release) => release.releaseDate ? formatHumanDate(release.releaseDate) : 'Sem dados' },
    { key: 'type', label: 'Tipo', get: (release) => getReleaseType(release) || 'Sem dados' },
    { key: 'budget', label: 'Orcamento', get: (release) => summarizeFinance(release).budget ? formatCurrency(summarizeFinance(release).budget) : 'Sem dados' },
    { key: 'spent', label: 'Gasto real', get: (release) => summarizeFinance(release).totalSpent ? formatCurrency(summarizeFinance(release).totalSpent) : 'Sem dados' },
    { key: 'result', label: 'Resultado', get: (release) => summarizeFinance(release).totalRevenue || summarizeFinance(release).totalSpent ? formatCurrency(summarizeFinance(release).result) : 'Sem dados' },
    { key: 'tasks', label: 'Tarefas planejadas', get: (release) => planDays.filter((day) => day.releaseId === release.id).length || 'Sem dados' },
    { key: 'done', label: 'Execucao', get: (release) => { const progress = getReleaseProgress(release.id, planDays); return progress.totalDays ? `${progress.percent}% (${progress.completedDays}/${progress.totalDays})` : 'Sem dados'; } },
    { key: 'pitch', label: 'Pitch', get: (release) => pitching.some((item) => item.releaseId === release.id) ? 'Gerado' : 'Sem dados' },
    { key: 'diagnosis', label: 'Diagnostico', get: (release) => release.diagnosis?.score ? `${release.diagnosis.score}/100` : 'Sem dados' },
    { key: 'streams', label: 'Streams', get: (release) => hasValue(getReleaseMetrics(release).streams) ? getReleaseMetrics(release).streams : 'Sem dados' },
    { key: 'views', label: 'Views', get: (release) => hasValue(getReleaseMetrics(release).views) ? getReleaseMetrics(release).views : 'Sem dados' },
    { key: 'saves', label: 'Salvamentos', get: (release) => hasValue(getReleaseMetrics(release).saves) ? getReleaseMetrics(release).saves : 'Sem dados' },
  ];
  const selected = releases.filter(Boolean);
  const insights = [];
  if (selected.length >= 2) {
    const bestExecution = selected.map((release) => ({ release, progress: getReleaseProgress(release.id, planDays).percent })).filter((item) => item.progress > 0).sort((a, b) => b.progress - a.progress)[0];
    if (bestExecution) insights.push(`${bestExecution.release.songTitle} teve maior execucao do calendario (${bestExecution.progress}%).`);
    const withResult = selected.map((release) => ({ release, summary: summarizeFinance(release) })).filter((item) => item.summary.totalRevenue || item.summary.totalSpent);
    if (withResult.length >= 2) insights.push(`${withResult.sort((a, b) => b.summary.result - a.summary.result)[0].release.songTitle} apresentou melhor resultado financeiro registrado.`);
    if (!insights.length) insights.push('Nao ha dados suficientes para concluir diferencas relevantes.');
  }
  return { rows, insights };
}
export function generateReport({ type, artist = {}, release = {}, planDays = [], tasks = [], pitching = [], pitchChecklists = {} }) {
  const diagnosis = analyzeRelease({ artist, release, planDays, tasks, pitching, pitchChecklists });
  const finance = summarizeFinance(release);
  const pitch = getPrimaryPitch({ pitching, artistId: release.artistId, releaseId: release.id });
  const releaseDays = planDays.filter((day) => day.releaseId === release.id);
  const playlists = suggestPlaylists(buildPitchContext(artist, release, getDefaultBrief(artist, release)));
  const title = `${reportTypes.find((item) => item.id === type)?.label || 'Relatorio'} - ${artist.stageName || 'Artista'} - ${release.songTitle || 'Lancamento'}`;
  const fullSections = {
    Resumo: [['Artista', artist.stageName || 'Nao informado'], ['Lancamento', release.songTitle || 'Nao informado'], ['Tipo', getReleaseType(release) || 'Nao informado'], ['Data', release.releaseDate ? formatFullDate(release.releaseDate) : 'Nao informado'], ['Status', release.status || 'Nao informado'], ['Narrativa', release.narrative || release.description || release.notes || 'Nao informado'], ['Genero e mood', [release.releaseGenre || release.genre || artist.genre, release.mood].filter(Boolean).join(' / ') || 'Nao informado'], ['Arquetipos', artist.archetype || 'Nao informado'], ['Linhas editoriais', artist.editorialLines || 'Nao informado']],
    'Estrategia e execucao': [['Dias planejados', releaseDays.length || 'Sem dados'], ['Dias concluidos', diagnosis.progress.completedDays || 'Sem dados'], ['Progresso', diagnosis.progress.totalDays ? `${diagnosis.progress.percent}%` : 'Sem dados'], ['Tarefas atrasadas', diagnosis.overdueDays || 'Sem dados'], ['Fases', [...new Set(releaseDays.map((day) => day.phase))].join(', ') || 'Nao informado']],
    'Pitching e playlists': [['Pitch principal', pitch?.text || 'Pitch ainda nao gerado'], ['Playlists compativeis', playlists.map((item) => item.name).join(', ') || 'Nao informado']],
    Diagnostico: [['Nota', `${diagnosis.score}/100`], ['Status', diagnosis.status], ['Pontos fortes', diagnosis.strengths.join('\n')], ['Pontos de atencao', diagnosis.warnings.join('\n')], ['Prioridades', diagnosis.priorities.map((item) => `${item.title} - ${item.priority}`).join('\n') || 'Sem prioridades']],
    Financeiro: [['Orcamento', finance.budget ? formatCurrency(finance.budget) : 'Nao informado'], ['Gasto real', finance.totalSpent ? formatCurrency(finance.totalSpent) : 'Nao informado'], ['Receita', finance.totalRevenue ? formatCurrency(finance.totalRevenue) : 'Nao informado'], ['Resultado', finance.totalRevenue || finance.totalSpent ? formatCurrency(finance.result) : 'Nao informado']],
    Links: getReleaseLinks(artist, release).map((link) => [link.label, link.href]),
  };
  const sectionFilters = { client: ['Resumo', 'Estrategia e execucao', 'Pitching e playlists', 'Financeiro', 'Links'], planning: ['Resumo', 'Estrategia e execucao', 'Pitching e playlists', 'Links'], performance: ['Resumo', 'Estrategia e execucao', 'Diagnostico'], financial: ['Resumo', 'Financeiro'], postlaunch: ['Resumo', 'Estrategia e execucao', 'Diagnostico', 'Financeiro'] };
  const allowed = sectionFilters[type];
  const sections = allowed ? Object.fromEntries(Object.entries(fullSections).filter(([key]) => allowed.includes(key))) : fullSections;
  return { type, title, content: sectionsToText(title, sections), snapshot: { artistId: artist.id, releaseId: release.id, releaseTitle: release.songTitle, artistName: artist.stageName, cover: getReleaseCover(release), diagnosis: buildDiagnosisSnapshot(diagnosis), finance, generatedAt: new Date().toISOString() } };
}

export function getCurrentOrClosestRelease(artistId, releases = []) {
  const artistReleases = releases.filter((release) => release.artistId === artistId);
  const today = todayInput();
  const future = artistReleases.filter((release) => release.releaseDate >= today).sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  if (future[0]) return future[0];
  return artistReleases.sort((a, b) => String(b.releaseDate || '').localeCompare(String(a.releaseDate || '')))[0] || null;
}

export function buildReleaseTimeline(release, planDays = []) {
  return planDays.filter((day) => day.releaseId === release?.id).map((day) => ({ ...day, phase: day.phase || getPlanPhase(day.offset) }));
}
