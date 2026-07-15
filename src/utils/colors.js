const NAMED_COLORS = {
  'azul eletrico': '#0066ff',
  'azul marinho': '#0b1f3a',
  'azul neon': '#00a8ff',
  'azul petroleo': '#0f4c5c',
  'azul royal': '#4169e1',
  'cinza chumbo': '#36454f',
  'cinza escuro': '#343a40',
  'rosa choque': '#ff1493',
  'verde militar': '#4b5320',
  'verde musgo': '#556b2f',
  'verde neon': '#39ff14',
  amarelo: '#facc15',
  azul: '#2563eb',
  bege: '#d6c4a8',
  bordo: '#800020',
  branco: '#ffffff',
  bronze: '#cd7f32',
  chumbo: '#36454f',
  ciano: '#00bcd4',
  cinza: '#808080',
  creme: '#fffdd0',
  dourado: '#d4af37',
  fucsia: '#ff00ff',
  laranja: '#f97316',
  lilas: '#c084fc',
  magenta: '#ff00ff',
  marrom: '#795548',
  ouro: '#d4af37',
  prata: '#c0c0c0',
  preto: '#0b0b0d',
  rosa: '#ec4899',
  roxo: '#7c3aed',
  turquesa: '#2dd4bf',
  verde: '#22c55e',
  vermelho: '#e53935',
  vinho: '#800020',
  violeta: '#8b5cf6',
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function splitEntries(value) {
  const entries = [];
  let current = '';
  let parenthesisDepth = 0;

  String(value || '').split('').forEach((character) => {
    if (character === '(') parenthesisDepth += 1;
    if (character === ')') parenthesisDepth = Math.max(0, parenthesisDepth - 1);
    if (parenthesisDepth === 0 && /[,;|\n]/.test(character)) {
      if (current.trim()) entries.push(current.trim());
      current = '';
      return;
    }
    current += character;
  });

  if (current.trim()) entries.push(current.trim());
  return entries;
}

function findNamedColors(entry) {
  let searchable = normalize(entry);
  const matches = [];

  Object.entries(NAMED_COLORS)
    .sort(([first], [second]) => second.length - first.length)
    .forEach(([name, color]) => {
      const pattern = new RegExp(`(^|[^a-z0-9])${name.replace(/\s+/g, '\\s+')}([^a-z0-9]|$)`, 'i');
      if (!pattern.test(searchable)) return;
      matches.push({ color, label: entry.trim() });
      searchable = searchable.replace(pattern, ' ');
    });

  return matches;
}

export function parseIdentityColors(value) {
  const entries = Array.isArray(value) ? value : splitEntries(value);
  const parsed = [];
  const seen = new Set();

  const addColor = (color, label) => {
    const key = color.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) return;
    seen.add(key);
    parsed.push({ color, label: label || color });
  };

  entries.forEach((rawEntry) => {
    const entry = String(rawEntry || '').replace(/[*_`#]{2,}/g, '').trim();
    if (!entry) return;

    const explicitColors = [
      ...(entry.match(/#[0-9a-f]{3,8}\b/gi) || []),
      ...(entry.match(/\b(?:rgb|hsl)a?\([^)]*\)/gi) || []),
    ];
    const bareHex = entry.match(/(?:^|\s)([0-9a-f]{6})(?:\s|$)/i)?.[1];
    if (bareHex) explicitColors.push(`#${bareHex}`);

    if (explicitColors.length) {
      explicitColors.forEach((color) => addColor(color, entry));
      return;
    }

    findNamedColors(entry).forEach(({ color, label }) => addColor(color, label));
  });

  return parsed;
}
