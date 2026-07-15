const SECTION_DEFINITIONS = [
  { key: 'flag', aliases: ['bandeira artística', 'bandeira artistica', 'bandeira'] },
  { key: 'archetypes', aliases: ['arquétipos', 'arquetipos', 'arquétipo', 'arquetipo'] },
  { key: 'accessories', aliases: ['acessórios', 'acessorios', 'acessório', 'acessorio'] },
  { key: 'objects', aliases: ['objetos', 'objeto'] },
  { key: 'vibe', aliases: ['vibe', 'atmosfera'] },
  { key: 'typography', aliases: ['tipografia', 'fontes', 'fonte'] },
  { key: 'colors', aliases: ['cores', 'paleta de cores', 'paleta'] },
];

function toText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

function normalizeLabel(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function cleanIdentityText(value) {
  return toText(value)
    .replace(/\r\n?/g, '\n')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*```[^\n]*$/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/\*\*|__|~~|`|\*|_/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findSection(label) {
  const normalized = normalizeLabel(label);
  return SECTION_DEFINITIONS.find((section) =>
    section.aliases.some((alias) => normalizeLabel(alias) === normalized),
  );
}

function parseIdentitySections(value) {
  const source = toText(value);
  if (!source.trim()) return {};

  const aliases = SECTION_DEFINITIONS.flatMap((section) => section.aliases)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const prepared = source.replace(
    new RegExp(`\\s+(?=(?:\\*{1,2}|_{1,2}|#{1,6}\\s*)?(?:${aliases})(?:\\*{1,2}|_{1,2})?\\s*:)`, 'giu'),
    '\n',
  );
  const sections = {};
  let activeKey = '';

  prepared.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine
      .trim()
      .replace(/^#{1,6}\s*/, '')
      .replace(/^[-+*>]\s*/, '')
      .replace(/\*\*|__|`/g, '')
      .trim();
    if (!line) return;

    const separatorIndex = line.indexOf(':');
    const possibleLabel = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
    const section = findSection(possibleLabel);

    if (section) {
      activeKey = section.key;
      const inlineValue = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
      if (inlineValue.trim()) sections[activeKey] = inlineValue.trim();
      return;
    }

    if (activeKey) {
      sections[activeKey] = [sections[activeKey], line].filter(Boolean).join('\n');
    }
  });

  return Object.fromEntries(
    Object.entries(sections).map(([key, text]) => [key, cleanIdentityText(text)]),
  );
}

function firstText(...values) {
  return cleanIdentityText(values.map(toText).find((value) => value.trim()) || '');
}

export function getArtistIdentity(artist = {}) {
  const sources = [
    artist.artisticIdentity,
    artist.artistIdentity,
    artist.brandIdentity,
    artist.visualIdentity,
    artist.identity,
    artist.branding,
    artist.archetype,
    artist.notes,
  ].filter((value) => toText(value).trim());
  const parsed = {};

  sources.forEach((source) => {
    const sections = parseIdentitySections(source);
    Object.entries(sections).forEach(([key, value]) => {
      if (!parsed[key] && value) parsed[key] = value;
    });
  });

  const archetypeSections = parseIdentitySections(artist.archetype);
  const plainArchetype = Object.keys(archetypeSections).length ? '' : artist.archetype;

  return {
    flag: firstText(artist.artisticFlag, artist.flag, artist.bandeiraArtistica, parsed.flag),
    archetypes: firstText(artist.archetypes, parsed.archetypes, plainArchetype),
    accessories: firstText(artist.accessories, artist.acessorios, parsed.accessories),
    objects: firstText(artist.objects, artist.objetos, parsed.objects),
    vibe: firstText(artist.vibe, artist.artistVibe, parsed.vibe),
    typography: firstText(artist.typography, artist.tipografia, parsed.typography),
    colors: firstText(artist.visualColors, artist.colors, parsed.colors),
  };
}

export function splitIdentityTags(value, limit = 4) {
  return cleanIdentityText(value)
    .split(/[,;|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}
