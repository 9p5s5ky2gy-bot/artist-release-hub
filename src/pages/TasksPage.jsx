import { CalendarCheck, Download, FileText, ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PlanDayCard } from '../components/PlanDayCard';
import { TaskFilters } from '../components/TaskFilters';
import { applyPlanDayFilters, emptyTaskFilters } from '../utils/filters';

export function TasksPage({
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
  const openDays = filteredDays.length - completedDays;
  const orientationCount = filteredDays.reduce((total, day) => total + day.orientations.length, 0);

  return (
    <section className="page-content tasks-page">
      <PageHeader eyebrow="Checklist diário" title="Dias do plano">
        <button className="secondary-button" onClick={onExportCsv} type="button">
          <Download size={16} />
          <span>CSV</span>
        </button>
        <button className="secondary-button" disabled title="Preparado para uma próxima versão" type="button">
          <FileText size={16} />
          <span>PDF em breve</span>
        </button>
      </PageHeader>

      <section className="task-summary-row">
        <div className="task-summary-card">
          <CalendarCheck size={18} />
          <span>Dias no filtro</span>
          <strong>{filteredDays.length}</strong>
        </div>
        <div className="task-summary-card urgent">
          <ListChecks size={18} />
          <span>Não concluídos</span>
          <strong>{openDays}</strong>
        </div>
        <div className="task-summary-card done">
          <span>Concluídos</span>
          <strong>{completedDays}</strong>
        </div>
        <div className="task-summary-card">
          <span>Orientações</span>
          <strong>{orientationCount}</strong>
        </div>
      </section>

      <TaskFilters filters={filters} setFilters={setFilters} artists={artists} releases={releases} />

      {filteredDays.length ? (
        <div className="plan-days-grid compact-plan-grid">
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
        <EmptyState title="Nenhum dia encontrado" text="Ajuste os filtros ou cadastre um lançamento com calendário gerado." />
      )}
    </section>
  );
}
