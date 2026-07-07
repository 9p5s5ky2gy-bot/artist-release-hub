export function ColorSwatches({ colors }) {
  const parsed = String(colors || '')
    .split(',')
    .map((color) => color.trim())
    .filter(Boolean);

  if (!parsed.length) return <span className="muted">Sem cores</span>;

  return (
    <div className="swatches" aria-label="Cores da identidade visual">
      {parsed.map((color) => (
        <span key={color} title={color} style={{ background: color }} />
      ))}
    </div>
  );
}
