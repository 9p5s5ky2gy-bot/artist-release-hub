import { getArtistIdentity } from './artistIdentity.js';
import { formatFullDate } from './date.js';
import { buildPitchContext, getDefaultBrief, suggestPlaylists } from './pitching.js';
import { getReleaseCover, getReleaseType } from './release.js';

const NOT_INFORMED = 'Não informado';
const REMOVED_CLIP_REPORT_SECTIONS = new Set(['postproduction', 'derived_content', 'strategy_relation', 'checklist']);

function text(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value || '').trim();
}

function valueOrFallback(value, fallback = NOT_INFORMED) {
  return text(value) || fallback;
}

function normalize(value) {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function uniqueValues(values, limit = 10) {
  const seen = new Set();
  return values
    .map(text)
    .filter((value) => {
      if (!value) return false;
      const key = normalize(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function field(label, value) {
  return `${label}: ${valueOrFallback(value)}`;
}

function lines(values) {
  const valid = uniqueValues(values);
  return valid.length ? valid.map((value) => `- ${value}`).join('\n') : `- ${NOT_INFORMED}`;
}

function getLatestPitch(pitches, type) {
  return pitches
    .filter((pitch) => pitch.type === type)
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))[0];
}

function getArchetypeDirection(archetypes) {
  const source = normalize(archetypes);
  const rules = [
    ['rebelde', 'Tensão, atitude, contraste, câmera mais agressiva, cortes secos e acabamento menos polido.'],
    ['amante', 'Desejo, intimidade, proximidade, pele, olhar, luz quente e atuação emocional.'],
    ['heroi', 'Superação, presença, movimento ascendente, enquadramentos fortes e sensação de conquista.'],
    ['mago', 'Transformação, símbolos, luz mutável, atmosfera incomum e transições visuais com intenção.'],
    ['criador', 'Processo, autoria, detalhes de produção, composição visual e escolhas estéticas marcantes.'],
    ['governante', 'Controle, precisão, luxo, simetria, postura dominante e direção de arte refinada.'],
    ['explorador', 'Liberdade, deslocamento, locações abertas, descoberta e câmera acompanhando o artista.'],
    ['sabio', 'Observação, significado, detalhes, ritmo contemplativo e imagens que favoreçam reflexão.'],
    ['inocente', 'Leveza, clareza, espontaneidade, luz suave e composição visual limpa.'],
    ['cuidador', 'Acolhimento, conexão humana, gestos próximos e imagens que transmitam proteção.'],
    ['bobo', 'Irreverência, surpresa, cor, timing visual e liberdade de performance.'],
    ['cara comum', 'Proximidade, cotidiano, verdade, locações reconhecíveis e atuação natural.'],
  ];
  const matched = rules.filter(([key]) => source.includes(key)).map(([, direction]) => direction);
  return matched.length ? matched.join('\n') : 'Arquétipo não informado; definir a personalidade visual antes da pré-produção.';
}

function getMoodDirection(context) {
  const source = normalize([context.mood, context.energy, context.genre, context.vibe].join(' '));
  const directions = [];
  if (/dark|sombr|noturn|intens|mister/.test(source)) directions.push('Contraste alto, áreas de sombra e pontos de luz controlados.');
  if (/sensual|desejo|amante|intim/.test(source)) directions.push('Close-ups, proximidade, movimentos lentos e luz com temperatura emocional.');
  if (/energ|rapido|dan[cç]|club|agress/.test(source)) directions.push('Câmera em movimento e cortes mais rápidos nos trechos de maior energia.');
  if (/triste|emoc|melanc|reflex/.test(source)) directions.push('Planos mais longos, respiração entre cortes e foco na expressão do artista.');
  return directions.length ? directions.join('\n') : 'Definir contraste, movimento de câmera e ritmo a partir do mood cadastrado.';
}

function getStrategyData(release, planDays, tasks) {
  const releaseDays = planDays.filter((day) => day.releaseId === release.id);
  const dayActions = releaseDays.flatMap((day) =>
    (Array.isArray(day.orientations) ? day.orientations : []).map((action) => ({ ...action, phase: day.phase, date: day.date, offset: day.offset })),
  );
  const fallbackActions = tasks.filter((task) => task.releaseId === release.id);
  const actions = dayActions.length ? dayActions : fallbackActions;
  const phases = uniqueValues(releaseDays.map((day) => day.phase));
  const ctas = uniqueValues(actions.map((action) => action.cta || action.callToAction).filter(Boolean), 8);
  const metrics = uniqueValues(actions.map((action) => action.metric || action.metrics).filter(Boolean), 8);
  const tips = uniqueValues(actions.map((action) => action.tip || action.shortTip || action.note).filter(Boolean), 8);
  const archetypes = uniqueValues(actions.map((action) => action.archetype || action.archetypeUsed).filter(Boolean), 8);
  const clipActions = actions.filter((action) => /clipe|video|visual|reels|tiktok|short|bastidor|teaser/.test(normalize(`${action.title} ${action.description} ${action.type}`)));
  const phaseActions = new Map();
  actions.forEach((action) => {
    const phase = text(action.phase) || 'Sem fase';
    if (!phaseActions.has(phase)) phaseActions.set(phase, []);
    const label = text(action.title || action.description);
    if (label && phaseActions.get(phase).length < 4) phaseActions.get(phase).push(label);
  });
  return {
    releaseDays,
    actions,
    phases,
    ctas,
    metrics,
    tips,
    archetypes,
    clipActions,
    phaseSummary: [...phaseActions.entries()].map(([phase, items]) => `${phase}: ${items.join('; ')}`).join('\n'),
  };
}

function getSafeCoverReference(release) {
  const cover = getReleaseCover(release);
  return /^data:/i.test(cover) ? '' : cover;
}

export function reportSectionsToText(title, sections, summaryForFilmmaker = '') {
  const body = sections.map((section) => `${section.title.toUpperCase()}\n${section.content}`).join('\n\n');
  return `${title}\n\n${body}${summaryForFilmmaker ? `\n\nRESUMO PARA FILMMAKER\n${summaryForFilmmaker}` : ''}`.trim();
}

export function sanitizeClipBrandingReport(report = {}) {
  if (report.type !== 'clip_branding' || !Array.isArray(report.sections)) return report;
  const sections = report.sections
    .filter((section) => !REMOVED_CLIP_REPORT_SECTIONS.has(section.id))
    .map((section, index) => ({
      ...section,
      title: `${index + 1}. ${String(section.title || '').replace(/^\d+\.\s*/, '')}`,
    }));

  return {
    ...report,
    sections,
    content: reportSectionsToText(report.title, sections, report.summaryForFilmmaker),
  };
}

export function generateClipBrandingReport({
  artist = {},
  release = {},
  planDays = [],
  tasks = [],
  pitching = [],
  pitchBrief = {},
}) {
  const identity = getArtistIdentity(artist);
  const releasePitches = pitching.filter((pitch) => pitch.artistId === release.artistId && pitch.releaseId === release.id);
  const spotifyPitch = getLatestPitch(releasePitches, 'spotify');
  const distributorPitch = getLatestPitch(releasePitches, 'distributor');
  const curatorPitch = getLatestPitch(releasePitches, 'curator');
  const blogPitch = getLatestPitch(releasePitches, 'blog');
  const englishPitch = releasePitches.find((pitch) => pitch.language === 'en');
  const portuguesePitch = releasePitches.find((pitch) => pitch.language === 'pt');
  const strategy = getStrategyData(release, planDays, tasks);
  const pitchContext = buildPitchContext(artist, release, { ...getDefaultBrief(artist, release), ...pitchBrief });
  const playlists = suggestPlaylists(pitchContext).slice(0, 5).map((playlist) => playlist.name);
  const artistName = valueOrFallback(artist.stageName, 'Artista');
  const releaseTitle = valueOrFallback(release.songTitle, 'Lançamento');
  const genre = valueOrFallback(release.releaseGenre || release.genre || pitchContext.releaseGenre || artist.genre);
  const mood = valueOrFallback(release.mood || pitchContext.mood);
  const energy = valueOrFallback(release.energy || pitchContext.energy);
  const narrative = valueOrFallback(release.narrative || pitchContext.narrative || release.description || release.notes);
  const targetAudience = valueOrFallback(pitchContext.targetAudience || artist.targetAudience);
  const visualReferences = valueOrFallback(artist.references || artist.visualReferences || release.references || pitchBrief.references);
  const positioning = valueOrFallback(artist.positioning || artist.posicionamento || identity.flag);
  const differential = valueOrFallback(artist.differential || artist.diferencial || artist.description);
  const tone = valueOrFallback(artist.communicationTone || artist.tone || identity.vibe);
  const clipActive = normalize(pitchContext.hasClip || release.hasClip) === 'true' || normalize(pitchBrief.hasClip) === 'sim' || Boolean(release.clipDate);
  const pitchHighlights = uniqueValues([
    spotifyPitch?.text,
    distributorPitch?.text,
    curatorPitch?.text,
    blogPitch?.text,
  ], 4);
  const archetypeDirection = getArchetypeDirection(identity.archetypes);
  const moodDirection = getMoodDirection({ mood, energy, genre, vibe: identity.vibe });
  const releaseDate = release.releaseDate ? formatFullDate(release.releaseDate) : NOT_INFORMED;
  const clipDate = release.clipDate ? formatFullDate(release.clipDate) : NOT_INFORMED;

  const sections = [
    {
      id: 'executive',
      title: '1. Resumo executivo',
      content: `Este relatório reúne o posicionamento visual, narrativo e estratégico de ${artistName} para orientar a criação do videoclipe ou peça visual de "${releaseTitle}". O objetivo é garantir coerência com a identidade do artista, diálogo com o público-alvo e aproveitamento do clipe na campanha de lançamento.\n\n${field('Formato visual confirmado', clipActive ? 'Sim' : 'Não informado; confirmar clipe, visualizer ou performance')}\n${field('Data do lançamento', releaseDate)}\n${field('Data do clipe', clipDate)}`,
    },
    {
      id: 'artist_identity',
      title: '2. Identidade do artista',
      content: `${field('Artista', artistName)}\n${field('Quem é', artist.shortBio || artist.bio || artist.description || artist.notes)}\n${field('Gênero musical', artist.genre)}\n${field('Estilo', artist.style || artist.estetica)}\n${field('Cidade/país', artist.cityCountry || artist.city || artist.country)}\n${field('Personalidade e vibe', identity.vibe)}\n${field('Bandeira artística', identity.flag)}\n${field('Diferencial', differential)}\n${field('Tom de comunicação', tone)}\n${field('Como deve ser percebido', artist.desiredPerception || artist.image || positioning)}\n\nInfluência dos arquétipos no clipe:\n${field('Arquétipos', identity.archetypes)}\n${archetypeDirection}`,
    },
    {
      id: 'branding',
      title: '3. Branding e posicionamento',
      content: `${field('Posicionamento', positioning)}\n${field('Imagem desejada', artist.desiredImage || artist.image || identity.vibe)}\n${field('Narrativa de marca', identity.flag || artist.brandNarrative || artist.notes)}\n${field('Valores transmitidos', artist.values || identity.flag)}\n${field('Estética principal', artist.aesthetic || artist.estetica || identity.vibe)}\n${field('Estética secundária', artist.secondaryAesthetic)}\n${field('Palavras-chave', artist.brandKeywords || [identity.vibe, identity.archetypes].filter(Boolean).join(', '))}\n${field('Sensação desejada', mood)}\n${field('Evitar', artist.visualRestrictions || artist.elementsToAvoid || 'Não informado; validar com o artista antes da gravação')}`,
    },
    {
      id: 'release_analysis',
      title: '4. Análise do lançamento',
      content: `${field('Música', releaseTitle)}\n${field('Tipo', getReleaseType(release))}\n${field('Resumo', release.description || release.notes)}\n${field('Tema da letra', release.lyricTheme || pitchContext.lyricTheme)}\n${field('Narrativa', narrative)}\n${field('Mood', mood)}\n${field('Energia', energy)}\n${field('Gênero/subgênero', [genre, release.subgenre || pitchContext.releaseSubgenre].filter(Boolean).join(' / '))}\n${field('Público-alvo', targetAudience)}\n${field('Mensagem central', release.centralMessage || narrative)}\n${field('Frase ou conceito principal', release.mainPhrase || release.concept)}\n${field('Símbolos visuais cadastrados', identity.objects || release.visualSymbols)}\n${field('Emoção a transmitir', release.desiredEmotion || mood)}\n\nPontos existentes nos pitches:\n${lines(pitchHighlights)}`,
    },
    {
      id: 'creative_direction',
      title: '5. Direção criativa do clipe',
      content: `${field('Conceito visual principal', release.visualConcept || release.concept || narrative)}\n${field('Ideia central', release.clipConcept || release.visualConcept)}\n${field('Cenas já cadastradas', release.suggestedScenes || release.scenes)}\n${field('Tom de atuação', release.performanceTone || identity.vibe)}\n${field('Locação', release.location || release.locations)}\n${field('Objetos importantes', identity.objects || release.props)}\n${field('Figurino', release.wardrobe || artist.wardrobe)}\n${field('Maquiagem/cabelo', release.hairMakeup || artist.hairMakeup)}\n${field('Cores sugeridas', identity.colors || release.visualColors)}\n${field('Referências visuais', visualReferences)}\n\nDiretriz sugerida de câmera, luz e edição:\n${moodDirection}\n${archetypeDirection}`,
    },
    {
      id: 'visual_narrative',
      title: '6. Narrativa visual',
      content: `${field('Narrativa-base', narrative)}\n\nEstrutura editável sugerida:\n- Começo: apresentar o artista, o universo visual e o conflito central sem explicar tudo.\n- Desenvolvimento: ampliar a emoção e conectar performance, lifestyle e símbolos cadastrados.\n- Virada: marcar a mudança principal da música com alteração de luz, câmera, locação ou atuação.\n- Clímax: reservar a imagem mais forte para o trecho de maior impacto.\n- Fechamento: concluir a sensação da faixa e deixar uma imagem-símbolo reutilizável na campanha.\n- Performance: gravar a música em planos abertos, médios e close-ups.\n- Lifestyle: ${valueOrFallback(release.lifestyleScenes, 'Definir com base na rotina e no posicionamento real do artista')}.\n- Cenas simbólicas: ${valueOrFallback(identity.objects || release.visualSymbols)}.\n- Vertical: planejar versões 9:16 de performance, virada, clímax e bastidores.`,
    },
    {
      id: 'art_direction',
      title: '7. Direção de arte',
      content: `${field('Paleta de cores', identity.colors || release.visualColors)}\n${field('Materiais/texturas', release.materials || artist.materials)}\n${field('Cenografia', release.scenography)}\n${field('Objetos de cena', release.props || identity.objects)}\n${field('Símbolos', release.visualSymbols || identity.objects)}\n${field('Elementos obrigatórios', release.requiredVisuals)}\n${field('Elementos proibidos', release.forbiddenVisuals || artist.visualRestrictions)}\n${field('Estilo de locação', release.locationStyle || release.locations)}\n${field('Figurino', release.wardrobe || artist.wardrobe)}\n${field('Cabelo/maquiagem', release.hairMakeup || artist.hairMakeup)}\n${field('Acessórios', identity.accessories)}\n${field('Tipografia', identity.typography)}\n${field('Referências', visualReferences)}`,
    },
    {
      id: 'photography',
      title: '8. Direção de fotografia',
      content: `${field('Direção cadastrada', release.photographyDirection)}\n${field('Iluminação', release.lighting)}\n${field('Cores de luz', release.lightColors || identity.colors)}\n${field('Período', release.shootingPeriod)}\n${field('Lentes/sensação', release.lensDirection)}\n${field('Textura/grão', release.imageTexture)}\n${field('Referência de cor', release.colorReference)}\n\nSugestão baseada no mood e na energia:\n${moodDirection}\n- Cobrir cada cena essencial em close-up, plano médio e plano aberto.\n- Definir antes da diária quando usar câmera estável e quando usar câmera de mão.\n- Fazer teste de luz, pele, figurino e cenário antes da primeira cena principal.`,
    },
    {
      id: 'pitch_relation',
      title: '9. Relação com pitching',
      content: `${field('Pitch Spotify', spotifyPitch?.text)}\n${field('Pitch distribuidora', distributorPitch?.text)}\n${field('Pitch curador', curatorPitch?.text)}\n${field('Pitch blog/release', blogPitch?.text)}\n${field('Pitch em português', portuguesePitch?.text)}\n${field('Pitch em inglês', englishPitch?.text)}\n${field('Playlists compatíveis', playlists.join(', '))}\n\nO clipe deve materializar visualmente gênero, mood, narrativa e público citados nos pitches. Imagens fortes, stills e bastidores também podem apoiar release para blogs, apresentação a curadores e campanha nas redes. Não tratar as playlists listadas como garantia de entrada.`,
    },
    {
      id: 'audience',
      title: '10. Público-alvo e reação desejada',
      content: `${field('Público-alvo', targetAudience)}\n${field('Superfãs/ações cadastradas', pitchContext.fanActions || release.fanActions)}\n${field('Emoção desejada', release.desiredEmotion || mood)}\n${field('Comentário desejado', release.desiredComment)}\n${field('Compartilhamento desejado', release.sharePrompt)}\n\nDiretriz sugerida: criar pelo menos um momento de identificação, um momento visual de impacto e um momento de performance que estimulem comentário, salvamento, compartilhamento e conversa por Direct sem prometer resultado.`,
    },
    {
      id: 'risks',
      title: '11. Riscos criativos',
      content: `- Clipe não combinar com o branding ou com os arquétipos cadastrados.\n- Estética genérica ou iluminação sem intenção.\n- Narrativa confusa ou excesso de informação visual.\n- Figurino, objetos ou locação fora da identidade.\n- Falta de cenas verticais, bastidores e material para pós-lançamento.\n- Clipe visualmente bonito, mas sem momentos reaproveitáveis nas redes.\n- Prometer no visual algo diferente do gênero, mood e campanha apresentados no pitch.`,
    },
    {
      id: 'recommendations',
      title: '12. Recomendações finais',
      content: `- Priorizar cenas que também gerem cortes curtos para Reels, TikTok e Shorts.\n- Garantir pelo menos cinco momentos visualmente fortes e identificáveis.\n- Captar bastidores em vertical durante toda a diária.\n- Criar uma cena-símbolo ligada à narrativa real da música.\n- Gravar variações de performance em diferentes enquadramentos.\n- Evitar estética desconectada da identidade e dos arquétipos do artista.\n- Validar antes da gravação todos os campos marcados como "Não informado".`,
    },
  ];

  const summaryForFilmmaker = `${artistName} — "${releaseTitle}"\nConceito: ${valueOrFallback(release.clipConcept || release.visualConcept || narrative)}\nMood/energia: ${mood} / ${energy}\nEstética: ${valueOrFallback(identity.vibe || artist.aesthetic)}\nArquétipos: ${valueOrFallback(identity.archetypes)}\nCores: ${valueOrFallback(identity.colors)}\nCenas principais: ${valueOrFallback(release.suggestedScenes || release.scenes, 'Performance, lifestyle, imagem-símbolo e tomadas verticais a definir na pré-produção')}\nReferências: ${visualReferences}\nEntregáveis: clipe principal, teaser vertical, cortes para Reels/TikTok/Shorts, making of, fotos e thumbnail.\nPrazo: ${clipDate !== NOT_INFORMED ? clipDate : releaseDate}\nObservações: ${valueOrFallback(release.clipNotes || release.notes)}`;
  const title = `Branding do Clipe - ${artistName} - ${releaseTitle}`;

  return {
    type: 'clip_branding',
    title,
    sections,
    summaryForFilmmaker,
    content: reportSectionsToText(title, sections, summaryForFilmmaker),
    snapshot: {
      artistId: artist.id,
      releaseId: release.id,
      artistName,
      releaseTitle,
      cover: getSafeCoverReference(release),
      genre,
      mood,
      archetypes: identity.archetypes || '',
      playlists,
      strategyPhases: strategy.phases,
      generatedAt: new Date().toISOString(),
    },
  };
}
