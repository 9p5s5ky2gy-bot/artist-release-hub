export const emptyTaskFilters = {
  artistId: '',
  releaseId: '',
  completion: '',
  type: '',
  date: '',
  priority: '',
  search: '',
};

export function applyTaskFilters(tasks, filters) {
  const search = (filters.search || '').trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesArtist = !filters.artistId || task.artistId === filters.artistId;
    const matchesRelease = !filters.releaseId || task.releaseId === filters.releaseId;
    const matchesType = !filters.type || task.type === filters.type;
    const matchesDate = !filters.date || task.date === filters.date;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesSearch =
      !search ||
      String(task.title || '').toLowerCase().includes(search) ||
      (task.description || '').toLowerCase().includes(search) ||
      (task.type || '').toLowerCase().includes(search);

    return matchesArtist && matchesRelease && matchesType && matchesDate && matchesPriority && matchesSearch;
  });
}

export function applyPlanDayFilters(planDays, filters) {
  const search = (filters.search || '').trim().toLowerCase();

  return planDays.filter((day) => {
    const matchesArtist = !filters.artistId || day.artistId === filters.artistId;
    const matchesRelease = !filters.releaseId || day.releaseId === filters.releaseId;
    const matchesDate = !filters.date || day.date === filters.date;
    const matchesCompletion =
      !filters.completion ||
      (filters.completion === 'completed' && day.completed) ||
      (filters.completion === 'open' && !day.completed);
    const matchesType = !filters.type || day.orientations.some((item) => item.type === filters.type);
    const matchesPriority = !filters.priority || day.orientations.some((item) => item.priority === filters.priority);
    const matchesSearch =
      !search ||
      String(day.release?.songTitle || '').toLowerCase().includes(search) ||
      (day.artist?.stageName || '').toLowerCase().includes(search) ||
      String(day.phase || '').toLowerCase().includes(search) ||
      day.orientations.some((item) =>
        `${item.title} ${item.description || ''} ${item.type || ''}`.toLowerCase().includes(search),
      );

    return matchesArtist && matchesRelease && matchesDate && matchesCompletion && matchesType && matchesPriority && matchesSearch;
  });
}
