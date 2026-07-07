import { addDays, formatDateInput } from './date';
import { getDailyActionCount, getReleaseType } from './release';

const MAX_RANDOM_PLAN_DAYS = 31;

const baseActions = {
  prelaunch: [
    ['Teaser visual da era', 'Poste uma foto ou vídeo curto com a estética do lançamento, sem entregar tudo.', 'post', 'média'],
    ['Bastidor curto do processo', 'Mostre estúdio, letra, produção, capa parcial ou referência visual.', 'bastidor', 'média'],
    ['Caixinha de perguntas', 'Abra uma caixa sobre a música, a estética ou o momento do artista.', 'story', 'média'],
    ['Teaser da letra', 'Transforme uma frase forte da música em arte, vídeo ou story.', 'post', 'média'],
    ['Story com enquete', 'Pergunte ao público qual clima eles esperam ouvir no lançamento.', 'story', 'baixa'],
    ['Vídeo com referência visual', 'Mostre uma referência que inspirou a era e conecte com a música.', 'reels', 'média'],
    ['Anúncio de data', 'Confirme a data com uma chamada simples e memorável.', 'post', 'alta'],
    ['Print do projeto', 'Mostre sessão, timeline, guia vocal ou arquivo do projeto como bastidor.', 'bastidor', 'média'],
    ['Antes/depois da música', 'Mostre como a ideia começou e como está chegando agora.', 'reels', 'média'],
  ],
  presave: [
    ['Abrir pré-save', 'Poste o link do pré-save e explique em uma frase por que isso ajuda.', 'pré-save', 'alta', 'presaveLink'],
    ['Story com link de pré-save', 'Faça stories diretos levando o público para o link do pré-save.', 'story', 'alta', 'presaveLink'],
    ['Reforço de pré-save', 'Faça uma chamada curta para salvar antes do lançamento.', 'pré-save', 'alta', 'presaveLink'],
    ['Teaser com CTA de pré-save', 'Use trecho ou visual e termine pedindo pré-save.', 'reels', 'alta', 'presaveLink'],
    ['Repost de quem fez pré-save', 'Compartilhe prints e marcações de fãs que já salvaram.', 'interação', 'média', 'presaveLink'],
  ],
  finalWeek: [
    ['Contagem regressiva', 'Assuma a semana do lançamento com chamada clara nos stories.', 'story', 'alta'],
    ['Trecho viciante', 'Poste vídeo curto com a parte mais forte ou grudenta da música.', 'TikTok', 'alta'],
    ['Teaser da capa', 'Mostre a capa ou um detalhe visual com data do lançamento.', 'post', 'alta'],
    ['Vídeo com legenda forte', 'Use uma frase curta da música como gancho visual.', 'reels', 'alta'],
    ['Trend adaptada à música', 'Adapte uma trend ao clima e ao trecho principal.', 'TikTok', 'média'],
    ['Mensagem para superfãs', 'Chame fãs próximos para comentar e compartilhar no lançamento.', 'interação', 'alta'],
    ['Story com lembrete', 'Peça para ativar lembrete e salvar a data.', 'story', 'alta'],
    ['Performance curta', 'Grave cantando ou interpretando o trecho principal em vídeo vertical.', 'reels', 'alta'],
  ],
  launchDay: [
    ['Post principal do lançamento', 'Publique capa, link e chamada direta para ouvir agora.', 'lançamento', 'alta', 'spotifyLink'],
    ['Stories com link', 'Faça sequência de stories levando para a música.', 'story', 'alta', 'spotifyLink'],
    ['Vídeo do trecho principal', 'Poste Reels/TikTok com o momento mais forte da música.', 'TikTok', 'alta', 'tiktokLink'],
    ['Repost de fãs', 'Reposte prints, marcações e primeiras reações.', 'interação', 'alta'],
    ['Fixar post e atualizar bio', 'Fixe o post principal e confira se a bio aponta para o link certo.', 'lançamento', 'alta', 'spotifyLink'],
  ],
  postlaunch: [
    ['Agradecimento pós-lançamento', 'Agradeça quem ouviu e reforce o link da música.', 'pós-lançamento', 'alta', 'spotifyLink'],
    ['Story perguntando parte favorita', 'Pergunte qual trecho o público mais gostou.', 'story', 'média'],
    ['Repostar fãs', 'Compartilhe prints, comentários e vídeos usando a música.', 'interação', 'média'],
    ['Conteúdo com letra', 'Transforme uma frase forte em vídeo, post ou story.', 'post', 'média'],
    ['Bastidor do lançamento', 'Mostre curiosidade, demo, capa, clipe ou versão alternativa.', 'bastidor', 'média'],
    ['Chamar para usar o áudio', 'Peça vídeos com o som no TikTok/Reels.', 'TikTok', 'média', 'tiktokLink'],
    ['Mostrar números ou feedback', 'Publique resultados, comentários ou prova social.', 'pós-lançamento', 'média'],
    ['Versão acústica ou demo', 'Mostre uma versão alternativa curta da música.', 'reels', 'média'],
    ['Explicar significado da música', 'Conte o significado da faixa em linguagem simples e humana.', 'post', 'média'],
  ],
};

const singleDateAnnouncementAction = [
  'Anúncio de data',
  'Anuncie oficialmente a data do single com uma chamada direta, visual forte e convite para acompanhar a semana final.',
  'post',
  'alta',
];

function normalizeActionText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isSingleRelease(release) {
  return normalizeActionText(getReleaseType(release)) === 'single';
}

function isDateAnnouncementAction(action) {
  return normalizeActionText(action?.[0]) === 'anuncio de data';
}

function getRequiredActionForSlot(release, offset, slot) {
  if (isSingleRelease(release) && offset === -7 && slot === 0) return singleDateAnnouncementAction;
  return null;
}
const typeActions = {
  EP: [
    ['Apresentar faixa foco do EP', 'Explique por que essa faixa puxa o projeto.', 'post', 'alta'],
    ['Mini-guia das faixas', 'Crie conteúdo curto apresentando o clima do EP.', 'reels', 'média'],
  ],
  Álbum: [
    ['Carrossel do conceito do álbum', 'Mostre narrativa, estética e tema central do projeto.', 'post', 'alta'],
    ['Mapa das faixas', 'Explique a jornada do álbum em formato simples.', 'post', 'média'],
  ],
  Clipe: [
    ['Bastidor do clipe', 'Mostre take, locação, styling ou direção visual.', 'bastidor', 'alta'],
    ['Teaser de cena do clipe', 'Publique corte visual curto antes de revelar tudo.', 'reels', 'alta'],
  ],
  Remix: [
    ['Comparar original e remix', 'Mostre antes/depois da energia da música.', 'TikTok', 'média'],
    ['Chamar para dançar o remix', 'Crie CTA para usar o áudio em vídeo curto.', 'TikTok', 'alta'],
  ],
  Deluxe: [
    ['Explicar novidade da deluxe', 'Mostre o que muda e por que vale ouvir.', 'post', 'alta'],
    ['Destacar faixa extra', 'Dê foco em uma música nova ou versão alternativa.', 'reels', 'média'],
  ],
};

const hooksByType = {
  post: ['Use capa/visual forte', 'Comece com uma frase da música', 'Mostre a estética da era'],
  story: ['Use enquete ou caixinha', 'Inclua sticker de link quando tiver', 'Faça pergunta simples'],
  reels: ['Abra com o trecho mais forte', 'Use legenda grande na tela', 'Corte em até 15 segundos'],
  TikTok: ['Use gancho nos 2 primeiros segundos', 'Aposte em trend adaptada', 'Chame o público para usar o áudio'],
  'pré-save': ['Mostre o link com clareza', 'Explique o benefício do pré-save', 'Peça uma ação rápida'],
  bastidor: ['Mostre algo real do processo', 'Não revele tudo', 'Conte uma curiosidade curta'],
  interação: ['Responda fãs pelo nome', 'Reposte comentários reais', 'Peça participação direta'],
  lançamento: ['Use link principal', 'Atualize bio e stories', 'Peça para ouvir e comentar'],
  'pós-lançamento': ['Mantenha a música viva', 'Mostre prova social', 'Reforce o link sem parecer repetitivo'],
};

const tipsByType = {
  post: ['Use uma imagem forte e pouco texto.', 'Deixe a frase principal respirar no visual.'],
  story: ['Use sticker de interação para puxar resposta.', 'Faça sequência curta, sem encher a tela.'],
  reels: ['Corte o vídeo para prender nos 2 primeiros segundos.', 'Coloque legenda grande e clara.'],
  TikTok: ['Entre direto no gancho, sem introdução longa.', 'Use o trecho mais reconhecível da música.'],
  'pré-save': ['Deixe o link a um toque de distância.', 'Mostre o benefício do pré-save em linguagem simples.'],
  bastidor: ['Mostre processo real, mesmo que simples.', 'Escolha um detalhe curioso e específico.'],
  interação: ['Responda e reposte pessoas reais.', 'Faça o público sentir que participa da campanha.'],
  lançamento: ['Use o link principal e uma chamada direta.', 'Peça uma ação clara: ouvir, salvar ou comentar.'],
  'pós-lançamento': ['Mantenha a música viva com novos ângulos.', 'Transforme reação do público em novo conteúdo.'],
};

const metricsByType = {
  post: 'salvamentos, comentários e compartilhamentos',
  story: 'respostas, cliques no link e votos',
  reels: 'retenção, compartilhamentos e uso do áudio',
  TikTok: 'retenção, comentários e uso do áudio',
  'pré-save': 'cliques no pré-save e respostas nos stories',
  bastidor: 'respostas, comentários e tempo de visualização',
  interação: 'DMs, marcações e reposts de fãs',
  lançamento: 'cliques no link, streams e comentários',
  'pós-lançamento': 'salvamentos, comentários e novos vídeos com o áudio',
};

const objectivesByPhase = {
  prelaunch: 'abrir curiosidade e preparar a narrativa da era',
  presave: 'converter atenção em pré-save e lembrete ativo',
  finalWeek: 'aumentar urgência e deixar a data impossível de ignorar',
  launchDay: 'levar o público para ouvir, salvar e comentar no lançamento',
  postlaunch: 'manter a música viva e transformar reação em novos conteúdos',
};

function hashSeed(text) {
  return String(text)
    .split('')
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function createRandom(seed) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function pickAction(pool, usedTitles, random) {
  const available = pool.filter((item) => !usedTitles.has(item[0]));
  const source = available.length ? available : pool;
  const action = source[Math.floor(random() * source.length)] || pool[0];
  usedTitles.add(action[0]);
  return action;
}

function pickFrom(items, random) {
  return items[Math.floor(random() * items.length)] || items[0];
}

function getPhase(offset) {
  if (offset === 0) return 'launchDay';
  if (offset > 0) return 'postlaunch';
  if (offset >= -7) return 'finalWeek';
  if (offset >= -14) return 'presave';
  return 'prelaunch';
}

function getPhaseLabel(phase) {
  const labels = {
    prelaunch: 'pré-lançamento',
    presave: 'pré-save',
    finalWeek: 'semana do lançamento',
    launchDay: 'dia do lançamento',
    postlaunch: 'pós-lançamento',
  };
  return labels[phase] || phase;
}

function buildPool(phase, release, artist, offset = 0) {
  const type = getReleaseType(release);
  const presaveReady = Boolean(release.presaveLink || release.presaveDate);
  let pool = [...baseActions[phase]];

  if (isSingleRelease(release) && offset < -7) {
    pool = pool.filter((action) => !isDateAnnouncementAction(action));
  }

  if (phase !== 'launchDay' && typeActions[type]) pool.push(...typeActions[type]);
  if (phase === 'presave' && !presaveReady) {
    return pool.filter((action) => action[2] !== 'pré-save' && action[4] !== 'presaveLink');
  }

  if (artist?.genre || artist?.archetype || release?.notes) {
    pool.push(['Conteúdo contextual da era', 'Adapte a ação ao estilo, estética e narrativa do artista.', 'post', 'média']);
  }

  return pool;
}

function buildSmartSuggestion({ action, release, artist, phase, slot, random }) {
  const [_title, description, type] = action;
  const typeHooks = hooksByType[type] || ['Faça uma entrega simples, clara e com chamada para ação'];
  const hook = pickFrom(typeHooks, random);
  const tip = pickFrom(tipsByType[type] || ['Mantenha a ação simples, visual e fácil de executar.'], random);
  const metric = metricsByType[type] || 'comentários, salvamentos e cliques';
  const objective = objectivesByPhase[phase] || 'avançar a estratégia do lançamento';
  const artistContext = [artist?.genre, artist?.archetype, release?.notes]
    .filter(Boolean)
    .join(' · ');
  const contextLine = artistContext ? `Contexto criativo: ${artistContext}. ` : '';
  const cta = phase === 'launchDay'
    ? 'CTA: ouvir agora, comentar e compartilhar.'
    : phase === 'postlaunch'
      ? 'CTA: comentar a parte favorita, salvar ou usar o áudio.'
      : phase === 'presave'
        ? 'CTA: fazer pré-save e ativar lembrete.'
        : 'CTA: responder, salvar a data ou acompanhar os próximos posts.';

  return `Sugestão IA ${slot + 1}: ${description} ${contextLine}Formato: ${type}. Gancho: ${hook}. Momento: ${getPhaseLabel(phase)}. ${cta} Dica curta: ${tip}. Objetivo: ${objective}. Métrica para observar: ${metric}.`;
}

export function generateRandomActionForDay({ release, artist, offset = 0, slot = 0, existingActions = [], seed = Date.now() }) {
  if (!release?.id || !release?.releaseDate) return null;

  const phase = getPhase(offset);
  const pool = buildPool(phase, release, artist, offset);
  const usedTitles = new Set(
    existingActions
      .map((item) => (typeof item === 'string' ? item : item?.title))
      .filter(Boolean),
  );
  const random = createRandom(hashSeed(`${release.id}-${release.releaseDate}-${offset}-${slot}-${seed}`));
  const requiredAction = getRequiredActionForSlot(release, offset, slot);
  const action = requiredAction || pickAction(pool, usedTitles, random);
  if (requiredAction) usedTitles.add(requiredAction[0]);
  const [title, _description, type, priority, linkField] = action;

  return {
    id: `${release.id}-random-${offset}-${slot + 1}-${seed}`,
    templateId: 'random-plan',
    generatedPlan: true,
    releaseId: release.id,
    artistId: release.artistId,
    title,
    description: buildSmartSuggestion({ action, release, artist, phase, slot, random }),
    type,
    date: formatDateInput(addDays(release.releaseDate, offset)),
    status: 'não concluído',
    priority,
    note: '',
    link: linkField ? release[linkField] || '' : '',
    offset,
    regeneratedAt: new Date().toISOString(),
  };
}
export function generateRandomActionsForRelease(release, artist, seed = Date.now()) {
  if (!release?.id || !release?.releaseDate) return [];

  const random = createRandom(hashSeed(`${release.id}-${release.releaseDate}-${seed}`));
  const dailyActionCount = getDailyActionCount(release);
  const usedTitles = new Set();
  const offsets = Array.from({ length: MAX_RANDOM_PLAN_DAYS }, (_, index) => index - 21);

  return offsets.flatMap((offset) => {
    const phase = getPhase(offset);
    const pool = buildPool(phase, release, artist, offset);

    return Array.from({ length: dailyActionCount }, (_, slot) => {
      const requiredAction = getRequiredActionForSlot(release, offset, slot);
      const action = requiredAction || pickAction(pool, usedTitles, random);
      if (requiredAction) usedTitles.add(requiredAction[0]);
      const [title, _description, type, priority, linkField] = action;

      return {
        id: `${release.id}-random-${offset}-${slot + 1}`,
        templateId: 'random-plan',
        generatedPlan: true,
        releaseId: release.id,
        artistId: release.artistId,
        title,
        description: buildSmartSuggestion({ action, release, artist, phase, slot, random }),
        type,
        date: formatDateInput(addDays(release.releaseDate, offset)),
        status: 'não concluído',
        priority,
        note: '',
        link: linkField ? release[linkField] || '' : '',
        offset,
      };
    });
  });
}
