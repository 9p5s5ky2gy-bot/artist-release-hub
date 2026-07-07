import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { priorities, taskTypes } from '../data/calendarTemplate';
import { emptyTaskFilters } from '../utils/filters';

export function TaskFilters({ filters, setFilters, artists, releases, showSearch = true }) {
  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'artistId' ? { releaseId: '' } : {}),
    }));
  }

  const visibleReleases = filters.artistId
    ? releases.filter((release) => release.artistId === filters.artistId)
    : releases;
  const activeFilters = Object.entries(filters).filter(([, value]) => Boolean(String(value || '').trim())).length;

  return (
    <section className="filters-bar" aria-label="Filtros de dias do plano">
      <div className="filters-heading">
        <div>
          <SlidersHorizontal size={16} />
          <strong>Filtros</strong>
        </div>
        <span>{activeFilters} ativo(s)</span>
      </div>

      {showSearch && (
        <label className="search-field">
          Buscar
          <span>
            <Search size={16} />
            <input name="search" value={filters.search} onChange={updateFilter} placeholder="Dia, música ou orientação" />
          </span>
        </label>
      )}
      <label>
        Artista
        <select name="artistId" value={filters.artistId} onChange={updateFilter}>
          <option value="">Todos</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.stageName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Lançamento
        <select name="releaseId" value={filters.releaseId} onChange={updateFilter}>
          <option value="">Todos</option>
          {visibleReleases.map((release) => (
            <option key={release.id} value={release.id}>
              {release.songTitle}
            </option>
          ))}
        </select>
      </label>
      <label>
        Conclusão
        <select name="completion" value={filters.completion} onChange={updateFilter}>
          <option value="">Todos</option>
          <option value="open">Não concluído</option>
          <option value="completed">Concluído</option>
        </select>
      </label>
      <label>
        Tipo
        <select name="type" value={filters.type} onChange={updateFilter}>
          <option value="">Todos</option>
          {taskTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        Data
        <input type="date" name="date" value={filters.date} onChange={updateFilter} />
      </label>
      <label>
        Prioridade
        <select name="priority" value={filters.priority} onChange={updateFilter}>
          <option value="">Todas</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </label>
      <button className="secondary-button compact" onClick={() => setFilters(emptyTaskFilters)} type="button">
        <RotateCcw size={15} />
        <span>Limpar</span>
      </button>
    </section>
  );
}
