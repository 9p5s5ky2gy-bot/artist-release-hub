import { Download, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PlanDayCard } from '../components/PlanDayCard';
import { StatusBadge } from '../components/StatusBadge';
import { TaskFilters } from '../components/TaskFilters';
import { applyPlanDayFilters, emptyTaskFilters } from '../utils/filters';

export function CalendarPage({
  artists,
  releases,
  planDays,
  onSetDayCompleted,
  onUpdateOrientation,
  onAddOrientation,
  onDeleteOrientation,
  onRegenerateOrientation,
  onExportCsv,
}) {
  const [filters, setFilters] = useState(emptyTaskFilters);

  const filteredDays = useMemo(
    () => applyPlanDayFilters(planDays, filters),
    [planDays, filters],
  );
  const completedDays = filteredDays.filter((day) => day.completed).length;
  const totalDays = filteredDays.length;
  const completion = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <section className="page-content calendar-page">
      <PageHeader eyebrow="Planejamento diário" title="Calendário">
        <button className="secondary-button" onClick={onExportCsv} type="button">
          <Download size={16} />
          <span>CSV</span>
        </button>
        <button className="secondary-button" disabled title="Preparado para uma próxima versão" type="button">
          <FileText size={16} />
          <span>PDF em breve</span>
        </button>
      </PageHeader>

      <section className="calendar-summary">
        <div>
          <span className="eyebrow">Checklist simplificado</span>
          <h2>{completedDays} de {totalDays} dias concluídos</h2>
          <p>O progresso agora conta apenas dias marcados como “Dia concluído”. Orientações não têm checkbox individual.</p>
        </div>
        <div className="summary-pills">
          <StatusBadge tone="mint">{completion}% feito</StatusBadge>
          <StatusBadge tone="blue">máx. 31 dias por lançamento</StatusBadge>
          <StatusBadge tone="neutral">{releases.length} lançamento(s)</StatusBadge>
        </div>
      </section>

      <TaskFilters
        filters={filters}
        setFilters={setFilters}
        artists={artists}
        releases={releases}
        showSearch
      />

      {filteredDays.length ? (
        <div className="plan-days-grid">
          {filteredDays.map((day) => (
            <PlanDayCard
              key={day.key}
              day={day}
              onSetDayCompleted={onSetDayCompleted}
              onUpdateOrientation={onUpdateOrientation}
              onAddOrientation={onAddOrientation}
              onDeleteOrientation={onDeleteOrientation}
              onRegenerateOrientation={onRegenerateOrientation}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum dia encontrado" text="Ajuste os filtros ou cadastre um lançamento com data definida." />
      )}
    </section>
  );
}
