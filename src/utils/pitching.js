import { getReleaseCover, getReleaseType } from './release';

export const pitchTypes = [
  { id: 'spotify', label: 'Spotify for Artists', max: 500 },
  { id: 'distributor', label: 'Distribuidora', max: 1000 },
  { id: 'curator', label: 'Curador de playlist', max: 700 },
  { id: 'blog', label: 'Blog / release curto', max: 900 },
  { id: 'email', label: 'E-mail profissional', max: 1400 },
  { id: 'short', label: 'Pitch curto para formulário', max: 300 },
  { id: 'campaign', label: 'Pitch completo para campanha', max: 1800 },
];

export const pitchChecklistItems = [
  { id: 'distributed', label: 'Música distribuída?' },
  { id: 'isrc', label: 'ISRC confirmado?' },
  { id: 'cover', label: 'Capa pronta?' },
  { id: 'profile', label: 'Perfil atualizado?' },
  { id: 'cityCountry', label: 'Cidade/país preenchidos?' },
  { id: 'genre', label: 'Gênero correto?' },
  { id: 'mood', label: 'Mood correto?' },
  { id: 'spotifyPitch', label: 'Pitch Spotify feito?' },
  { id: 'distributorPitch', label: 'Pitch distribuidora feito?' },
  { id: 'curatorPitch', label: 'Pitch para curadores feito?' },
  { id: 'links', label: 'Links organizados?' },
  { id: 'presave', label: 'Pré-save pronto?' },
  { id: 'promotionPlan', label: 'Plano de divulgação definido?' },
  { id: 'clip', label: 'Clipe/visualizer definido?' },
  { id: 'socialCampaign', label: 'Campanha nas redes definida?' },
];

const playlistCatalog = [
  {
    category: 'Pop / Pop Alternativo',
    keywords: ['pop', 'alternativo', 'alternative', 'bedroom', 'hyperpop', 'indie', 'global pop'],
    playlists: ['Fresh Finds Pop', 'Pop Rising', 'Lorem', 'OBSESSED', 'SUPERNOVA', 'New Music Friday', 'Indie Pop', 'Bedroom Pop', 'Hyperpop', 'Alternative Pop'],
  },
  {
    category: 'Eletrônico / Club / Dance',
    keywords: ['eletronico', 'eletrônico', 'electronic', 'club', 'dance', 'house', 'night', 'energetico', 'energético'],
    playlists: ['Dance Rising', 'mint', 'Electronic Rising', 'Club Hits', 'Hyperpop', 'Night Pop', 'Dance Pop'],
  },
  {
    category: 'Trap / Rap / Drill',
    keywords: ['trap', 'rap', 'drill', 'hip hop', 'hip-hop', 'rima', 'plug'],
    playlists: ['RapCaviar', 'Fresh Finds Hip-Hop', 'Trap Brasil', 'Drill', 'Internet People', 'Paredão Trap', 'Radar Hip-Hop'],
  },
  {
    category: 'Funk / Brasil',
    keywords: ['funk', 'brasil', 'brazil', 'paredao', 'paredão', 'viral'],
    playlists: ['Funk Hits', 'Funk Brasil', 'Novos Fluxos', 'Paredão Funk', 'Brasil Viral'],
  },
  {
    category: 'R&B / Sensual',
    keywords: ['r&b', 'rnb', 'sensual', 'sexy', 'late night', 'chill', 'chilled'],
    playlists: ['R&B Rising', 'Chilled R&B', 'Mood Booster', 'Sexy Pop', 'Late Night Vibes'],
  },
  {
    category: 'Triste / Emocional',
    keywords: ['triste', 'sad', 'emocional', 'melancolia', 'heartbreak', 'sombrio', 'dark'],
    playlists: ['Sad Songs', 'Melancolia', 'Bedroom Pop', 'Indie Sad', 'Heartbreak'],
  },
  {
    category: 'Rock / Alternativo',
    keywords: ['rock', 'alternativo', 'alternative', 'guitarra', 'indie rock'],
    playlists: ['Rock This', 'All New Rock', 'Alternative', 'Indie Rock', 'Fresh Finds Rock'],
  },
  {
    category: 'K-pop / Idol / Performance',
    keywords: ['k-pop', 'kpop', 'idol', 'performance', 'dance pop', 'coreografia'],
    playlists: ['K-Pop ON', 'Pop Rising', 'Dance Pop', 'Idol Pop', 'Global Pop'],
  },
];

const hypeWords = ['revolucionar', 'hit mundial', 'sucesso garantido', 'maior artista', 'incomparável'];

function text(value) {
  return String(value || '').trim();
}

function normalize(value) {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function splitList(value) {
  return text(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstValue(...values) {
  return values.map(text).find(Boolean) || '';
}

function yes(value) {
  return ['sim', 'yes', 'true', 'ativo', 'ativa'].includes(normalize(value));
}

function sentenceJoin(items, fallback = '') {
  const clean = items.map(text).filter(Boolean);
  if (!clean.length) return fallback;
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} e ${clean.at(-1)}`;
}

function limitText(value, max) {
  const clean = text(value).replace(/\s+/g, ' ');
  if (!max || clean.length <= max) return clean;
  const shortened = clean.slice(0, max - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : max - 1).trim()}…`;
}

export function getPitchKey(artistId, releaseId) {
  return `${artistId || 'sem-artista'}:${releaseId || 'sem-lancamento'}`;
}

export function buildPitchContext(artist = {}, release = {}, brief = {}) {
  const language = firstValue(brief.songLanguage, release.songLanguage, release.language);
  const genre = firstValue(brief.releaseGenre, release.genre, release.releaseGenre, artist.genre, brief.primaryGenre);
  const subgenre = firstValue(brief.releaseSubgenre, release.subgenre, brief.subgenres);
  const mood = firstValue(brief.mood, release.mood);
  const musicLink = firstValue(brief.musicLink, release.spotifyLink);
  const presaveLink = firstValue(brief.presaveLink, release.presaveLink);
  const youtubeLink = firstValue(brief.youtubeLink, release.youtubeLink);
  const hasClip = yes(brief.hasClip) || normalize(getReleaseType(release)) === 'clipe';
  const hasPaidTraffic = yes(brief.paidTraffic) || Boolean(text(brief.trafficBudget));
  const hasPresave = yes(brief.presaveActive) || Boolean(presaveLink);

  return {
    artistName: firstValue(brief.artistName, artist.stageName, 'Artista'),
    cityCountry: firstValue(brief.cityCountry, artist.cityCountry),
    primaryGenre: firstValue(brief.primaryGenre, artist.genre),
    subgenres: firstValue(brief.subgenres, artist.subgenres),
    shortBio: firstValue(brief.shortBio, artist.shortBio),
    spotify: firstValue(brief.artistSpotify, artist.spotify),
    instagram: firstValue(brief.artistInstagram, artist.instagram),
    tiktok: firstValue(brief.artistTiktok, artist.tiktok),
    youtube: firstValue(brief.artistYoutube, artist.youtube),
    deezer: firstValue(brief.deezer, artist.deezer),
    appleMusic: firstValue(brief.appleMusic, artist.appleMusic),
    totalStreams: firstValue(brief.totalStreams, artist.totalStreams),
    monthlyListeners: firstValue(brief.monthlyListeners, artist.monthlyListeners),
    spotifyFollowers: firstValue(brief.spotifyFollowers, artist.spotifyFollowers),
    instagramFollowers: firstValue(brief.instagramFollowers, artist.instagramFollowers),
    tiktokFollowers: firstValue(brief.tiktokFollowers, artist.tiktokFollowers),
    collaborations: firstValue(brief.collaborations, artist.collaborations),
    previousPlaylists: firstValue(brief.previousPlaylists, artist.previousPlaylists),
    achievements: firstValue(brief.achievements, artist.achievements),
    archetypes: firstValue(brief.archetypes, artist.archetype),
    editorialLines: firstValue(brief.editorialLines, artist.editorialLines, artist.notes),
    targetAudience: firstValue(brief.targetAudience, artist.targetAudience),
    internalNotes: firstValue(brief.internalNotes, artist.notes),
    songTitle: firstValue(brief.songTitle, release.songTitle, 'lançamento'),
    releaseType: firstValue(brief.releaseType, getReleaseType(release)),
    releaseDate: firstValue(brief.releaseDate, release.releaseDate),
    songLanguage: language,
    releaseGenre: genre,
    releaseSubgenre: subgenre,
    mood,
    energy: firstValue(brief.energy, release.energy),
    lyricTheme: firstValue(brief.lyricTheme, release.lyricTheme),
    narrative: firstValue(brief.narrative, release.narrative),
    description: firstValue(brief.description, release.description, release.notes),
    inspiration: firstValue(brief.inspiration, release.inspiration),
    feat: firstValue(brief.feat, release.feat),
    producer: firstValue(brief.producer, release.producer),
    composer: firstValue(brief.composer, release.composer),
    hasClip,
    clipDate: firstValue(brief.clipDate, release.clipDate),
    hasPresave,
    presaveLink,
    cover: firstValue(brief.cover, getReleaseCover(release)),
    musicLink,
    youtubeLink,
    promotionPlan: firstValue(brief.promotionPlan, release.promotionPlan),
    hasPaidTraffic,
    trafficBudget: firstValue(brief.trafficBudget, release.trafficBudget),
    fanActions: firstValue(brief.fanActions, release.fanActions),
    socialCampaign: firstValue(brief.socialCampaign, release.socialCampaign),
    influencers: firstValue(brief.influencers, release.influencers),
    blogs: firstValue(brief.blogs, release.blogs),
    desiredPlaylists: firstValue(brief.desiredPlaylists, release.desiredPlaylists),
    notes: firstValue(brief.notes, release.notes),
  };
}

export function getDefaultBrief(artist = {}, release = {}) {
  return {
    artistName: artist.stageName || '',
    cityCountry: artist.cityCountry || '',
    primaryGenre: artist.genre || '',
    subgenres: artist.subgenres || '',
    shortBio: artist.shortBio || '',
    artistSpotify: artist.spotify || '',
    artistInstagram: artist.instagram || '',
    artistTiktok: artist.tiktok || '',
    artistYoutube: artist.youtube || '',
    deezer: artist.deezer || '',
    appleMusic: artist.appleMusic || '',
    totalStreams: artist.totalStreams || '',
    monthlyListeners: artist.monthlyListeners || '',
    spotifyFollowers: artist.spotifyFollowers || '',
    instagramFollowers: artist.instagramFollowers || '',
    tiktokFollowers: artist.tiktokFollowers || '',
    collaborations: artist.collaborations || '',
    previousPlaylists: artist.previousPlaylists || '',
    achievements: artist.achievements || '',
    archetypes: artist.archetype || '',
    editorialLines: artist.editorialLines || artist.notes || '',
    targetAudience: artist.targetAudience || '',
    internalNotes: artist.notes || '',
    songTitle: release.songTitle || '',
    releaseType: getReleaseType(release),
    releaseDate: release.releaseDate || '',
    songLanguage: release.songLanguage || release.language || 'Automático',
    releaseGenre: release.genre || artist.genre || '',
    releaseSubgenre: release.subgenre || '',
    mood: release.mood || '',
    energy: release.energy || '',
    lyricTheme: release.lyricTheme || '',
    narrative: release.narrative || '',
    description: release.description || release.notes || '',
    inspiration: release.inspiration || '',
    feat: release.feat || '',
    producer: release.producer || '',
    composer: release.composer || '',
    hasClip: normalize(getReleaseType(release)) === 'clipe' ? 'sim' : '',
    clipDate: release.clipDate || '',
    presaveActive: release.presaveLink ? 'sim' : '',
    presaveLink: release.presaveLink || '',
    cover: getReleaseCover(release),
    musicLink: release.spotifyLink || '',
    youtubeLink: release.youtubeLink || '',
    promotionPlan: release.promotionPlan || '',
    paidTraffic: '',
    trafficBudget: '',
    fanActions: '',
    socialCampaign: '',
    influencers: '',
    blogs: '',
    desiredPlaylists: '',
    notes: release.notes || '',
  };
}

export function resolvePitchLanguage(context, requestedLanguage = 'auto') {
  if (requestedLanguage === 'en' || requestedLanguage === 'pt') return requestedLanguage;
  const language = normalize(context.songLanguage);
  if (language.includes('ingles') || language.includes('english')) return 'en';
  return 'pt';
}

function buildHighlightsPt(context) {
  const items = [];
  if (context.totalStreams) items.push(`${context.totalStreams} streams informados`);
  if (context.monthlyListeners) items.push(`${context.monthlyListeners} ouvintes mensais`);
  if (context.spotifyFollowers) items.push(`${context.spotifyFollowers} seguidores no Spotify`);
  if (context.achievements) items.push(context.achievements);
  if (context.collaborations) items.push(`colaborações: ${context.collaborations}`);
  return items.slice(0, 3);
}

function buildPromotionPt(context) {
  const items = [];
  if (context.promotionPlan) items.push(context.promotionPlan);
  if (context.socialCampaign) items.push(`campanha nas redes: ${context.socialCampaign}`);
  if (context.hasPresave) items.push('pré-save');
  if (context.hasClip) items.push(context.clipDate ? `clipe/visual em ${context.clipDate}` : 'clipe/visual');
  if (context.fanActions) items.push(`ações com fãs: ${context.fanActions}`);
  if (context.influencers) items.push(`influenciadores: ${context.influencers}`);
  if (context.hasPaidTraffic) items.push(context.trafficBudget ? `tráfego pago com orçamento de ${context.trafficBudget}` : 'tráfego pago');
  if (context.blogs) items.push(`blogs/páginas: ${context.blogs}`);
  return items;
}

function buildIntroPt(context) {
  const genreMood = sentenceJoin([context.releaseGenre, context.releaseSubgenre, context.mood], 'identidade musical em desenvolvimento');
  const type = context.releaseType || 'lançamento';
  return `${context.artistName} apresenta "${context.songTitle}", ${type.toLowerCase()} com ${genreMood}.`;
}

function buildIntroEn(context) {
  const genreMood = sentenceJoin([context.releaseGenre, context.releaseSubgenre, context.mood], 'a developing musical identity');
  const type = context.releaseType || 'release';
  return `${context.artistName} presents "${context.songTitle}", a ${type.toLowerCase()} shaped by ${genreMood}.`;
}

function buildPromotionEn(context) {
  const items = [];
  if (context.promotionPlan) items.push(context.promotionPlan);
  if (context.socialCampaign) items.push(`social content campaign: ${context.socialCampaign}`);
  if (context.hasPresave) items.push('pre-save');
  if (context.hasClip) items.push(context.clipDate ? `music video/visual on ${context.clipDate}` : 'music video/visual');
  if (context.fanActions) items.push(`fan actions: ${context.fanActions}`);
  if (context.influencers) items.push(`influencers: ${context.influencers}`);
  if (context.hasPaidTraffic) items.push(context.trafficBudget ? `paid media budget of ${context.trafficBudget}` : 'paid media');
  return items;
}

function getPlaylistNames(playlists) {
  return playlists.slice(0, 3).map((item) => item.name).join(', ');
}

export function generatePitch({ type = 'spotify', context, playlists = [], language = 'auto' }) {
  const pitchType = pitchTypes.find((item) => item.id === type) || pitchTypes[0];
  const lang = resolvePitchLanguage(context, language);
  const playlistNames = getPlaylistNames(playlists);
  const promoPt = buildPromotionPt(context);
  const promoEn = buildPromotionEn(context);
  const highlights = buildHighlightsPt(context);
  const relevantLinks = [context.musicLink, context.presaveLink, context.youtubeLink].filter(Boolean);

  let title = pitchType.label;
  let body = '';

  if (lang === 'en') {
    const intro = buildIntroEn(context);
    const promo = promoEn.length
      ? `The rollout includes ${sentenceJoin(promoEn)}.`
      : 'The pitch can focus on short-form content, social storytelling and playlist outreach once the rollout is confirmed.';

    if (type === 'curator') {
      body = `Hi, hope you are well. I would like to share "${context.songTitle}", the new release by ${context.artistName}. The track fits ${context.releaseGenre || 'the playlist mood'}${context.mood ? ` with a ${context.mood} mood` : ''}. ${promo} Link: ${context.musicLink || context.presaveLink || ''}`;
    } else if (type === 'email') {
      title = `Email: ${context.artistName} - ${context.songTitle}`;
      body = `Subject: ${context.artistName} - "${context.songTitle}" for consideration\n\nHi,\n\n${intro} ${context.description || context.narrative || ''}\n\n${promo}\n\n${playlistNames ? `Compatible playlist references: ${playlistNames}.` : ''}\n\nLink: ${context.musicLink || context.presaveLink || ''}\n\nBest,\n${context.artistName}`;
    } else if (type === 'short') {
      body = `${intro} ${promo}`;
    } else if (type === 'campaign') {
      body = `${intro}\n\nArtist: ${context.shortBio || context.archetypes || context.editorialLines || 'Emerging project with active identity development.'}\n\nSong: ${context.description || context.narrative || context.lyricTheme || 'Release focused on mood, audience fit and digital rollout.'}\n\nPromotion: ${promo}\n\nTarget audience: ${context.targetAudience || 'Listeners aligned with the genre, mood and visual identity.'}\n\nPlaylist references: ${playlistNames || 'to be refined by genre and mood'}.\n\nLinks: ${relevantLinks.join(' | ')}`;
    } else {
      body = `${intro} ${promo} ${playlistNames ? `Compatible playlist references include ${playlistNames}.` : ''}`;
    }
  } else {
    const intro = buildIntroPt(context);
    const promo = promoPt.length
      ? `A divulgação contará com ${sentenceJoin(promoPt)}.`
      : 'O pitch pode focar em vídeos curtos, stories, narrativa visual e contato com curadores quando o plano for confirmado.';

    if (type === 'spotify') {
      body = `${highlights.length ? `Com ${sentenceJoin(highlights)}, ` : ''}${intro} ${promo} ${playlistNames ? `Playlists como ${playlistNames} são referências compatíveis.` : ''}`;
    } else if (type === 'distributor') {
      body = `${intro} ${context.description || context.narrative || ''} ${promo} ${context.targetAudience ? `Público-alvo: ${context.targetAudience}.` : ''} ${playlistNames ? `Playlists-alvo: ${playlistNames}.` : ''} ${relevantLinks.length ? `Links: ${relevantLinks.join(' | ')}` : ''}`;
    } else if (type === 'curator') {
      body = `Olá! Tudo bem? Gostaria de apresentar "${context.songTitle}", novo lançamento de ${context.artistName}. A faixa combina com ${context.releaseGenre || 'a proposta da playlist'}${context.mood ? ` e tem mood ${context.mood}` : ''}. Acredito que pode funcionar na playlist pela identidade sonora e pelo plano de divulgação. ${promo} Link: ${context.musicLink || context.presaveLink || ''}`;
    } else if (type === 'blog') {
      body = `${context.artistName} lança "${context.songTitle}", ${context.releaseType.toLowerCase()} que mistura ${sentenceJoin([context.releaseGenre, context.mood, context.narrative], 'gênero, mood e narrativa do artista')}. ${context.description || ''} ${promo}`;
    } else if (type === 'email') {
      title = `E-mail: ${context.artistName} - ${context.songTitle}`;
      body = `Assunto: ${context.artistName} - "${context.songTitle}" para avaliação\n\nOlá, tudo bem?\n\nGostaria de apresentar "${context.songTitle}", novo lançamento de ${context.artistName}.\n\n${intro} ${context.description || context.narrative || ''}\n\n${promo}\n\n${playlistNames ? `Referências de playlists compatíveis: ${playlistNames}.` : ''}\n\nLink: ${context.musicLink || context.presaveLink || ''}\n\nObrigado pela atenção,\n${context.artistName}`;
    } else if (type === 'short') {
      body = `${intro} ${promo}`;
    } else if (type === 'campaign') {
      body = `Resumo do artista: ${context.shortBio || context.archetypes || context.editorialLines || 'Projeto em desenvolvimento com identidade própria.'}\n\nResumo da música: ${intro} ${context.description || context.narrative || context.lyricTheme || ''}\n\nMood/gênero: ${sentenceJoin([context.releaseGenre, context.releaseSubgenre, context.mood, context.energy], 'adicione gênero e mood para fortalecer o pitch')}.\n\nPúblico-alvo: ${context.targetAudience || 'definir público-alvo na aba Pitching'}.\n\nEstratégia de divulgação: ${promo}\n\nPlaylists indicadas: ${playlistNames || 'gerar a partir de gênero, mood e energia'}.\n\nLinks importantes: ${relevantLinks.join(' | ') || 'adicione link da música, pré-save ou press kit'}.`;
    }
  }

  return {
    type,
    language: lang,
    title,
    text: limitText(body, pitchType.max),
    characterLimit: pitchType.max,
  };
}

export function suggestPlaylists(context) {
  const desired = splitList(context.desiredPlaylists);
  const haystack = normalize([
    context.releaseGenre,
    context.releaseSubgenre,
    context.mood,
    context.energy,
    context.songLanguage,
    context.description,
    context.narrative,
    context.archetypes,
    context.editorialLines,
    context.targetAudience,
    context.releaseType,
  ].join(' '));

  const suggestions = [];

  playlistCatalog.forEach((category) => {
    const matchedKeywords = category.keywords.filter((keyword) => haystack.includes(normalize(keyword)));
    const baseScore = matchedKeywords.length;
    category.playlists.forEach((name, index) => {
      const desiredBoost = desired.some((item) => normalize(name).includes(normalize(item)) || normalize(item).includes(normalize(name))) ? 2 : 0;
      const score = baseScore + desiredBoost + (index < 3 ? 0.35 : 0);
      if (score <= 0 && suggestions.length > 10) return;
      suggestions.push({
        name,
        category: category.category,
        score,
        compatibility: score >= 3 ? 'alta' : score >= 1.5 ? 'média' : 'baixa',
        reason:
          score > 0
            ? `Combina com ${category.category.toLowerCase()} e sinais de ${matchedKeywords.join(', ') || 'mood/gênero informado'}.`
            : `Referência ampla para validar se mood, idioma e energia realmente encaixam.`,
        highlight: context.promotionPlan
          ? `Destacar campanha: ${context.promotionPlan}.`
          : `Destacar gênero, mood, identidade do artista e consistência de conteúdo.`,
        note: 'Referência de compatibilidade, não garantia de entrada.',
      });
    });
  });

  return suggestions
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .filter((item, index, array) => array.findIndex((other) => other.name === item.name) === index)
    .slice(0, 8);
}

export function scorePitchQuality(context, draft) {
  const textValue = text(draft?.text);
  const max = draft?.characterLimit || 1000;
  const checks = [
    { ok: Boolean(context.releaseGenre || context.primaryGenre), points: 12, strong: 'gênero definido', improve: 'adicionar gênero principal' },
    { ok: Boolean(context.mood || context.energy), points: 12, strong: 'mood/energia claros', improve: 'adicionar mood ou energia da faixa' },
    { ok: buildPromotionPt(context).length > 0, points: 18, strong: 'plano de divulgação citado', improve: 'incluir plano de divulgação, redes, fãs ou curadores' },
    { ok: Boolean(context.musicLink || context.presaveLink || context.youtubeLink), points: 12, strong: 'links importantes disponíveis', improve: 'adicionar link da música, pré-save ou YouTube' },
    { ok: Boolean(context.targetAudience), points: 10, strong: 'público-alvo informado', improve: 'definir público-alvo' },
    { ok: Boolean(context.totalStreams || context.monthlyListeners || context.achievements || context.previousPlaylists), points: 10, strong: 'dados relevantes usados com base', improve: 'adicionar dados reais do artista, se existirem' },
    { ok: textValue.length <= max, points: 12, strong: 'dentro do limite de caracteres', improve: 'encurtar para o limite do formato' },
    { ok: textValue.length > 80 && textValue.length <= max, points: 8, strong: 'texto objetivo', improve: 'deixar o texto mais objetivo e completo' },
    { ok: !hypeWords.some((word) => normalize(textValue).includes(normalize(word))), points: 6, strong: 'sem promessa exagerada', improve: 'remover promessas exageradas' },
  ];

  const score = Math.min(100, checks.reduce((sum, item) => sum + (item.ok ? item.points : 0), 0));
  return {
    score,
    strong: checks.filter((item) => item.ok).map((item) => item.strong).slice(0, 4),
    improve: checks.filter((item) => !item.ok).map((item) => item.improve).slice(0, 4),
  };
}

export function getPitchDateAlert(releaseDate) {
  if (!releaseDate) return 'Adicione a data de lançamento para receber alerta de prazo.';
  const today = new Date();
  const target = new Date(`${releaseDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return 'Data de lançamento inválida.';
  const diff = Math.ceil((target - today) / 86400000);
  if (diff > 20) return 'Faltam mais de 20 dias: ótimo momento para preparar pitch.';
  if (diff >= 15) return 'Faltam entre 15 e 20 dias: envie o pitch agora.';
  if (diff >= 0) return 'Faltam menos de 15 dias: ainda dá para organizar pitch de curadores e distribuidora.';
  return 'Lançamento já saiu: foque em curadores, blogs, playlists de usuários e pós-lançamento.';
}

export function buildPitchExport({ context, drafts = [], playlists = [], checklist = {} }) {
  const checklistLines = pitchChecklistItems.map((item) => `${checklist[item.id] ? '[x]' : '[ ]'} ${item.label}`);
  const playlistLines = playlists.map((item) => `- ${item.name} (${item.compatibility}): ${item.reason} Destaque: ${item.highlight}`);
  const draftLines = drafts.map((draft) => `## ${draft.title}\n${draft.text}\nCaracteres: ${draft.text.length}/${draft.characterLimit || 'sem limite'}`);

  return [
    `Artist Release Hub - Pitching`,
    `${context.artistName} - ${context.songTitle}`,
    '',
    '## Pitches',
    draftLines.join('\n\n') || 'Nenhum pitch gerado ainda.',
    '',
    '## Playlists compatíveis',
    playlistLines.join('\n') || 'Nenhuma playlist sugerida.',
    '',
    '## Checklist',
    checklistLines.join('\n'),
  ].join('\n');
}
