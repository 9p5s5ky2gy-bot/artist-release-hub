function inferTone(value) {
  const text = String(value || '').toLowerCase();
  if (['feito', 'lançado', 'finalizado'].some((item) => text.includes(item))) return 'mint';
  if (['alta', 'atrasada', 'atrasado'].some((item) => text.includes(item))) return 'red';
  if (['média', 'pré-save', 'hoje'].some((item) => text.includes(item))) return 'yellow';
  if (['baixa', 'planejamento'].some((item) => text.includes(item))) return 'blue';
  if (['tiktok', 'reels', 'youtube'].some((item) => text.includes(item))) return 'coral';
  return 'neutral';
}

export function StatusBadge({ children, tone }) {
  const badgeTone = tone || inferTone(children);
  return <span className={`status-badge tone-${badgeTone}`}>{children}</span>;
}
