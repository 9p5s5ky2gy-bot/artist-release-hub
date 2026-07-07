import { addDays, formatDateInput } from './date';
import { getReleaseType } from './release';

const MAX_RANDOM_PLAN_DAYS = 31;

const baseActions = {
  prelaunch: [
    ['Teaser visual da era', 'Postar foto ou vídeo com estética do lançamento.', 'post', 'média'],
    ['Bastidor curto do processo', 'Mostrar estúdio, letra, produção ou referência sem entregar tudo.', 'bastidor', 'média'],
    ['Caixinha de perguntas', 'Abrir perguntas sobre a música, estética ou momento do artista.', 'story', 'média'],
    ['Teaser da letra', 'Publicar uma frase forte da música em formato visual.', 'post', 'média'],
    ['Story com enquete', 'Perguntar ao público qual clima eles esperam ouvir.', 'story', 'baixa'],
    ['Vídeo com referência visual', 'Mostrar uma referência que inspirou a era do lançamento.', 'reels', 'média'],
    ['Anúncio de data', 'Confirmar a data de lançamento com chamada simples.', 'post', 'alta'],
    ['Print do projeto', 'Mostrar sessão, timeline, capa parcial ou bastidor do arquivo.', 'bastidor', 'média'],
  ],
  presave: [
    ['Abrir pré-save', 'Postar link do pré-save e explicar como isso ajuda o artista.', 'pré-save', 'alta', 'presaveLink'],
    ['Story com link de pré-save', 'Levar o público direto para o pré-save nos stories.', 'story', 'alta', 'presaveLink'],
    ['Reforço de pré-save', 'Fazer chamada curta para salvar antes do lançamento.', 'pré-save', 'alta', 'presaveLink'],
    ['Teaser com CTA de pré-save', 'Usar trecho ou visual e terminar pedindo pré-save.', 'reels', 'alta', 'presaveLink'],
  ],
  finalWeek: [
    ['Contagem regressiva', 'Iniciar chamada clara para a semana do lançamento.', 'story', 'alta'],
    ['Trecho viciante', 'Postar vídeo curto com a parte mais forte da música.', 'TikTok', 'alta'],
    ['Teaser da capa', 'Mostrar a capa ou detalhe visual com data do lançamento.', 'post', 'alta'],
    ['Vídeo com legenda forte', 'Usar uma frase curta da música como gancho.', 'reels', 'alta'],
    ['Trend adaptada à música', 'Adaptar trend ao clima e ao trecho principal.', 'TikTok', 'média'],
    ['Mensagem para superfãs', 'Chamar fãs próximos para comentar e compartilhar no lançamento.', 'interação', 'alta'],
    ['Story com lembrete', 'Pedir para ativar lembrete e salvar a data.', 'story', 'alta'],
  ],
  launchDay: [
    ['Post principal do lançamento', 'Publicar capa, link e chamada direta para ouvir agora.', 'lançamento', 'alta', 'spotifyLink'],
    ['Stories com link', 'Fazer sequência de stories levando para a música.', 'story', 'alta', 'spotifyLink'],
    ['Vídeo do trecho principal', 'Postar Reels/TikTok com o momento mais forte da música.', 'TikTok', 'alta', 'tiktokLink'],
    ['Repost de fãs', 'Repostar prints, marcações e primeiras reações.', 'interação', 'alta'],
  ],
  postlaunch: [
    ['Agradecimento pós-lançamento', 'Agradecer quem ouviu e reforçar o link da música.', 'pós-lançamento', 'alta', 'spotifyLink'],
    ['Story perguntando parte favorita', 'Perguntar qual trecho o público mais gostou.', 'story', 'média'],
    ['Repostar fãs', 'Compartilhar prints, comentários e vídeos usando a música.', 'interação', 'média'],
    ['Conteúdo com letra', 'Transformar uma frase forte em vídeo, post ou story.', 'post', 'média'],
    ['Bastidor do lançamento', 'Mostrar curiosidade, demo, capa, clipe ou versão alternativa.', 'bastidor', 'média'],
    ['Chamar para usar o áudio', 'Pedir vídeos com o som no TikTok/Reels.', 'TikTok', 'média', 'tiktokLink'],
    ['Mostrar números ou feedback', 'Publicar resultados, comentários ou prova social.', 'pós-lançamento', 'média'],
    ['Versão acústica ou demo', 'Mostrar uma versão alternativa curta da música.', 'reels', 'média'],
  ],
};

const typeActions = {
  EP: [
    ['Apresentar faixa foco do EP', 'Explicar por que essa faixa puxa o projeto.', 'post', 'alta'],
    ['Mini-guia das faixas', 'Criar conteúdo curto apresentando o clima do EP.', 'reels', 'média'],
  ],
  Álbum: [
    ['Carrossel do conceito do álbum', 'Mostrar narrativa, estética e tema central do projeto.', 'post', 'alta'],
    ['Mapa das faixas', 'Explicar a jornada do álbum em formato simples.', 'post', 'média'],
  ],
  Clipe: [
    ['Bastidor do clipe', 'Mostrar take, locação, styling ou direção visual.', 'bastidor', 'alta'],
    ['Teaser de cena do clipe', 'Publicar corte visual curto antes de revelar tudo.', 'reels', 'alta'],
  ],
  Remix: [
    ['Comparar original e remix', 'Mostrar antes/depois da energia da música.', 'TikTok', 'média'],
    ['Chamar para dançar o remix', 'Criar CTA para usar o áudio em vídeo curto.', 'TikTok', 'alta'],
  ],
  Deluxe: [
    ['Explicar novidade da deluxe', 'Mostrar o que muda e por que vale ouvir.', 'post', 'alta'],
    ['Destacar faixa extra', 'Dar foco em uma música nova ou versão alternativa.', 'reels', 'média'],
  ],
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

function getPhase(offset) {
  if (offset === 0) return 'launchDay';
  if (offset > 0) return 'postlaunch';
  if (offset >= -7) return 'finalWeek';
  if (offset >= -14) return 'presave';
  return 'prelaunch';
}

function buildPool(phase, release, artist) {
  const type = getReleaseType(release);
  const presaveReady = Boolean(release.presaveLink || release.presaveDate);
  const pool = [...baseActions[phase]];

  if (phase !== 'launchDay' && typeActions[type]) pool.push(...typeActions[type]);
  if (phase === 'presave' && !presaveReady) {
    return pool.filter((action) => action[2] !== 'pré-save' && action[4] !== 'presaveLink');
  }

  if (artist?.genre || artist?.archetype || release?.notes) {
    pool.push(['Conteúdo contextual da era', 'Adaptar a ação ao estilo, estética e narrativa do artista.', 'post', 'média']);
  }

  return pool;
}

export function generateRandomActionsForRelease(release, artist, seed = Date.now()) {
  if (!release?.id || !release?.releaseDate) return [];

  const random = createRandom(hashSeed(`${release.id}-${release.releaseDate}-${seed}`));
  const usedTitles = new Set();
  const offsets = Array.from({ length: MAX_RANDOM_PLAN_DAYS }, (_, index) => index - 21);

  return offsets.map((offset) => {
    const phase = getPhase(offset);
    const action = pickAction(buildPool(phase, release, artist), usedTitles, random);
    const [title, description, type, priority, linkField] = action;

    return {
      id: `${release.id}-random-${offset}`,
      templateId: 'random-plan',
      generatedPlan: true,
      releaseId: release.id,
      artistId: release.artistId,
      title,
      description,
      type,
      date: formatDateInput(addDays(release.releaseDate, offset)),
      status: 'não concluído',
      priority,
      note: '',
      link: linkField ? release[linkField] || '' : '',
      offset,
    };
  });
}
