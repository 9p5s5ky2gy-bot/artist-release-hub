function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function exportTasksCsv(planDays) {
  const headers = [
    'Dia do plano',
    'Data',
    'Artista',
    'Lançamento',
    'Relação com lançamento',
    'Fase',
    'Concluído',
    'Orientações',
  ];

  const rows = planDays.map((day) => [
    day.dayNumber,
    day.date,
    day.artist?.stageName || '',
    day.release?.songTitle || '',
    day.relation,
    day.phase,
    day.completed ? 'Sim' : 'Não',
    day.orientations.map((item) => item.title).join(' | '),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(';'))
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `artist-release-hub-dias-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
