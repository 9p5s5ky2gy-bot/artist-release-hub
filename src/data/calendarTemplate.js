export const taskTypes = [
  'post',
  'story',
  'reels',
  'TikTok',
  'YouTube Shorts',
  'pré-save',
  'bastidor',
  'interação',
  'lançamento',
  'pós-lançamento',
  'orientação',
];

export const dayStatuses = ['não concluído', 'concluído'];
export const priorities = ['baixa', 'média', 'alta'];

export const releaseStatuses = [
  'planejamento',
  'pré-save ativo',
  'lançado',
  'pós-lançamento',
  'finalizado',
];

const day = (offset, tasks) =>
  tasks.map((task, index) => ({
    id: `${offset}-${index + 1}`,
    offset,
    ...task,
  }));

export const calendarTemplate = [
  ...day(-21, [
    {
      title: 'Definir conceito visual da era',
      description: 'Consolidar estética, cores, referências e narrativa visual do lançamento.',
      type: 'bastidor',
      priority: 'alta',
    },
    {
      title: 'Separar referências de posts',
      description: 'Organizar ideias para feed, Reels, TikTok e stories alinhadas à música.',
      type: 'post',
      priority: 'média',
    },
    {
      title: 'Story de desejo musical',
      description: 'Perguntar aos fãs que tipo de música eles querem ouvir.',
      type: 'story',
      priority: 'média',
    },
  ]),
  ...day(-20, [
    {
      title: 'Postar bastidor curto',
      description: 'Mostrar um detalhe do processo sem revelar tudo.',
      type: 'bastidor',
      priority: 'média',
    },
    {
      title: 'Abrir caixa de perguntas',
      description: 'Coletar curiosidades dos fãs nos stories.',
      type: 'story',
      priority: 'média',
    },
  ]),
  ...day(-19, [
    {
      title: 'Publicar conteúdo da estética',
      description: 'Postar foto ou vídeo ligado ao universo visual da música.',
      type: 'post',
      priority: 'média',
    },
    {
      title: 'Responder DMs de fãs',
      description: 'Ativar conversas individuais e mapear fãs mais engajados.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(-18, [
    {
      title: 'Postar trecho visual sem áudio oficial',
      description: 'Criar curiosidade usando estética, letra ou clima da faixa.',
      type: 'reels',
      priority: 'média',
    },
    {
      title: 'Fazer enquete nos stories',
      description: 'Testar percepção sobre mood, capa, frase ou tema.',
      type: 'story',
      priority: 'baixa',
    },
  ]),
  ...day(-17, [
    {
      title: 'Conteúdo sobre o sentimento da música',
      description: 'Explicar a emoção central da faixa sem entregar tudo.',
      type: 'post',
      priority: 'média',
    },
    {
      title: 'Criar lista de superfãs',
      description: 'Separar contatos que podem comentar, compartilhar e salvar no lançamento.',
      type: 'interação',
      priority: 'alta',
    },
  ]),
  ...day(-16, [
    {
      title: 'Preparar teaser',
      description: 'Finalizar corte curto para anunciar a chegada da música.',
      type: 'reels',
      priority: 'alta',
    },
    {
      title: 'Revisar links e capa',
      description: 'Checar capa, links, bio, destaques e materiais de apoio.',
      type: 'pré-save',
      priority: 'alta',
    },
  ]),
  ...day(-15, [
    {
      title: 'Anunciar que algo está chegando',
      description: 'Publicar chamada misteriosa com data ou pista do lançamento.',
      type: 'post',
      priority: 'alta',
    },
    {
      title: 'Story com contagem regressiva',
      description: 'Adicionar sticker de contagem para preparar o público.',
      type: 'story',
      priority: 'alta',
    },
  ]),
  ...day(-14, [
    {
      title: 'Abrir pré-save',
      description: 'Publicar o link e conferir se todos os destinos estão corretos.',
      type: 'pré-save',
      priority: 'alta',
      linkField: 'presaveLink',
    },
    {
      title: 'Postar link do pré-save',
      description: 'Levar tráfego para o pré-save no feed, bio e stories.',
      type: 'story',
      priority: 'alta',
      linkField: 'presaveLink',
    },
    {
      title: 'Explicar valor do pré-save',
      description: 'Mostrar por que o pré-save ajuda o artista no dia do lançamento.',
      type: 'story',
      priority: 'média',
      linkField: 'presaveLink',
    },
  ]),
  ...day(-13, [
    {
      title: 'Postar vídeo curto com trecho',
      description: 'Usar um trecho marcante da música em formato vertical.',
      type: 'TikTok',
      priority: 'alta',
    },
    {
      title: 'Repostar fãs do pré-save',
      description: 'Compartilhar prints e marcações de quem já fez pré-save.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(-12, [
    {
      title: 'Postar bastidores da criação',
      description: 'Mostrar estúdio, composição, guia vocal, capa ou processo criativo.',
      type: 'bastidor',
      priority: 'média',
    },
    {
      title: 'Pergunta sobre a música',
      description: 'Criar interação nos stories com pergunta relacionada ao tema da faixa.',
      type: 'story',
      priority: 'média',
    },
  ]),
  ...day(-11, [
    {
      title: 'Publicar storytelling',
      description: 'Contar uma parte da história por trás da letra ou da era.',
      type: 'post',
      priority: 'alta',
    },
    {
      title: 'Estimular comentários',
      description: 'Encerrar o conteúdo com uma pergunta simples e comentável.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(-10, [
    {
      title: 'Postar teaser oficial',
      description: 'Soltar teaser com data, capa, nome da música ou trecho selecionado.',
      type: 'reels',
      priority: 'alta',
    },
    {
      title: 'Colocar pré-save em destaque',
      description: 'Fixar link na bio, destaques, story e onde fizer sentido.',
      type: 'pré-save',
      priority: 'alta',
      linkField: 'presaveLink',
    },
  ]),
  ...day(-9, [
    {
      title: 'Vídeo com frase forte',
      description: 'Transformar letra ou punchline em vídeo curto.',
      type: 'YouTube Shorts',
      priority: 'média',
    },
    {
      title: 'Story com enquete',
      description: 'Usar enquete para escolher frase, mood ou expectativa.',
      type: 'story',
      priority: 'baixa',
    },
  ]),
  ...day(-8, [
    {
      title: 'Postar foto ou vídeo da era',
      description: 'Reforçar identidade visual e clima do lançamento.',
      type: 'post',
      priority: 'média',
    },
    {
      title: 'Responder comentários',
      description: 'Aumentar conversa nos posts recentes.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(-7, [
    {
      title: 'Iniciar contagem regressiva forte',
      description: 'Assumir a semana do lançamento como tema central dos canais.',
      type: 'story',
      priority: 'alta',
    },
    {
      title: 'Reels/TikTok com gancho chamativo',
      description: 'Publicar vídeo com abertura forte e trecho memorável.',
      type: 'reels',
      priority: 'alta',
    },
  ]),
  ...day(-6, [
    {
      title: 'Bastidor de clipe, capa ou estúdio',
      description: 'Mostrar material humano e visual do processo.',
      type: 'bastidor',
      priority: 'média',
    },
    {
      title: 'Pedir lembrete aos fãs',
      description: 'Usar stories para pedir ativação de lembrete e pré-save.',
      type: 'story',
      priority: 'alta',
      linkField: 'presaveLink',
    },
  ]),
  ...day(-5, [
    {
      title: 'Vídeo com trecho viciante',
      description: 'Publicar a parte mais grudenta da música em vertical.',
      type: 'TikTok',
      priority: 'alta',
    },
    {
      title: 'Repostar interações',
      description: 'Valorizar comentários, DMs e prints dos fãs.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(-4, [
    {
      title: 'Mostrar significado da faixa',
      description: 'Explicar a mensagem da música em formato curto.',
      type: 'post',
      priority: 'alta',
    },
    {
      title: 'Caixa de perguntas',
      description: 'Abrir espaço para dúvidas sobre a música, letra ou bastidores.',
      type: 'story',
      priority: 'média',
    },
  ]),
  ...day(-3, [
    {
      title: 'Postar teaser final',
      description: 'Soltar a última peça forte antes da reta final.',
      type: 'reels',
      priority: 'alta',
    },
    {
      title: 'Reforçar pré-save',
      description: 'Lembrar o público do link com chamada direta.',
      type: 'pré-save',
      priority: 'alta',
      linkField: 'presaveLink',
    },
  ]),
  ...day(-2, [
    {
      title: 'Vídeo curto de chamada',
      description: 'Chamar o público para o lançamento com data clara.',
      type: 'YouTube Shorts',
      priority: 'alta',
    },
    {
      title: 'Story com contagem regressiva',
      description: 'Reforçar o sticker de contagem para o dia do lançamento.',
      type: 'story',
      priority: 'alta',
    },
  ]),
  ...day(-1, [
    {
      title: 'Postar amanhã',
      description: 'Criar publicação direta anunciando que a música sai amanhã.',
      type: 'post',
      priority: 'alta',
    },
    {
      title: 'Story com link',
      description: 'Levar para o pré-save e manter a contagem ativa.',
      type: 'story',
      priority: 'alta',
      linkField: 'presaveLink',
    },
    {
      title: 'Mensagem para superfãs',
      description: 'Enviar mensagem para a lista de superfãs pedindo apoio no lançamento.',
      type: 'interação',
      priority: 'alta',
    },
  ]),
  ...day(0, [
    {
      title: 'Postar capa oficial',
      description: 'Publicar arte oficial com nome da música e chamada clara.',
      type: 'lançamento',
      priority: 'alta',
    },
    {
      title: 'Postar link da música',
      description: 'Divulgar o link principal em bio, stories e canais sociais.',
      type: 'lançamento',
      priority: 'alta',
      linkField: 'spotifyLink',
    },
    {
      title: 'Reels/TikTok com trecho principal',
      description: 'Publicar vídeo vertical usando o trecho mais forte.',
      type: 'TikTok',
      priority: 'alta',
      linkField: 'tiktokLink',
    },
    {
      title: 'Repostar fãs',
      description: 'Compartilhar marcações, prints e reações durante o dia.',
      type: 'interação',
      priority: 'alta',
    },
    {
      title: 'Fixar post',
      description: 'Fixar publicação principal no perfil.',
      type: 'post',
      priority: 'alta',
    },
    {
      title: 'Atualizar bio com link',
      description: 'Garantir que o link principal esteja na bio.',
      type: 'lançamento',
      priority: 'alta',
      linkField: 'spotifyLink',
    },
    {
      title: 'Stories durante o dia',
      description: 'Fazer sequência de stories acompanhando o lançamento em tempo real.',
      type: 'story',
      priority: 'alta',
    },
  ]),
  ...day(1, [
    {
      title: 'Agradecer quem ouviu',
      description: 'Publicar agradecimento e reforçar o link da música.',
      type: 'pós-lançamento',
      priority: 'alta',
      linkField: 'spotifyLink',
    },
    {
      title: 'Repostar prints',
      description: 'Compartilhar ouvintes, playlists e comentários recebidos.',
      type: 'interação',
      priority: 'média',
    },
    {
      title: 'Pedir comentários',
      description: 'Estimular o público a comentar a parte favorita.',
      type: 'story',
      priority: 'média',
    },
  ]),
  ...day(2, [
    {
      title: 'Postar vídeo novo usando a música',
      description: 'Criar novo conteúdo vertical com contexto diferente.',
      type: 'reels',
      priority: 'alta',
    },
    {
      title: 'Estimular uso do áudio',
      description: 'Convidar seguidores a criarem vídeos com o som.',
      type: 'TikTok',
      priority: 'média',
      linkField: 'tiktokLink',
    },
  ]),
  ...day(3, [
    {
      title: 'Postar bastidor ou versão alternativa',
      description: 'Mostrar take extra, guia, acústico, letra ou curiosidade.',
      type: 'bastidor',
      priority: 'média',
    },
    {
      title: 'Perguntar parte favorita',
      description: 'Usar sticker ou caixa para coletar respostas dos fãs.',
      type: 'story',
      priority: 'média',
    },
  ]),
  ...day(4, [
    {
      title: 'Postar conteúdo com letra',
      description: 'Transformar trecho da letra em post, vídeo ou story.',
      type: 'post',
      priority: 'média',
    },
    {
      title: 'Responder comentários',
      description: 'Manter engajamento nos posts e vídeos da semana.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(5, [
    {
      title: 'Postar prova social',
      description: 'Divulgar números, feedbacks, prints ou comentários relevantes.',
      type: 'pós-lançamento',
      priority: 'média',
    },
    {
      title: 'Repostar fãs',
      description: 'Dar destaque para quem está usando ou compartilhando a música.',
      type: 'interação',
      priority: 'média',
    },
  ]),
  ...day(6, [
    {
      title: 'Novo vídeo criativo',
      description: 'Publicar variação de conteúdo para manter a música circulando.',
      type: 'YouTube Shorts',
      priority: 'média',
    },
    {
      title: 'Reforçar link',
      description: 'Trazer o link da música de volta nos stories e bio.',
      type: 'pós-lançamento',
      priority: 'média',
      linkField: 'spotifyLink',
    },
  ]),
  ...day(7, [
    {
      title: 'Fechamento da primeira semana',
      description: 'Celebrar resultados e agradecer a comunidade.',
      type: 'pós-lançamento',
      priority: 'alta',
    },
    {
      title: 'Organizar próximos conteúdos',
      description: 'Definir novos vídeos, cortes, versões e ações da segunda semana.',
      type: 'pós-lançamento',
      priority: 'média',
    },
  ]),
];

