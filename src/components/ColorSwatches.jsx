import { parseIdentityColors } from '../utils/colors';

export function ColorSwatches({ colors }) {
  const parsed = parseIdentityColors(colors);

  if (!parsed.length) return <span className="muted">Cores não definidas</span>;

  return (
    <div className="swatches" aria-label="Cores da identidade visual">
      {parsed.map(({ color, label }) => (
        <span
          aria-label={label}
          key={`${color}-${label}`}
          role="img"
          title={label}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
