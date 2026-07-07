import { Bell, Cloud, Database, FileText, LockKeyhole, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

const roadmap = [
  { label: 'Login', icon: LockKeyhole, status: 'planejado' },
  { label: 'Supabase', icon: Database, status: 'planejado' },
  { label: 'Vercel', icon: Cloud, status: 'pronto para build' },
  { label: 'PDF', icon: FileText, status: 'planejado' },
  { label: 'Upload de capa', icon: Upload, status: 'planejado' },
  { label: 'Notificações', icon: Bell, status: 'planejado' },
];

export function SettingsPage({ artists, releases, tasks, planDays, onLoadDemo, onClearData, onRegenerateAll }) {
  return (
    <section className="page-content">
      <PageHeader eyebrow="Sistema" title="Configurações simples" />

      <div className="stats-grid">
        <StatCard label="Artistas salvos" value={artists.length} icon={Database} tone="mint" />
        <StatCard label="Lançamentos salvos" value={releases.length} icon={Cloud} tone="blue" />
        <StatCard label="Dias planejados" value={planDays.length} icon={FileText} tone="yellow" />
        <StatCard label="Orientações salvas" value={tasks.length} icon={FileText} tone="coral" />
      </div>

      <section className="settings-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>Dados locais</h2>
            <StatusBadge>localStorage</StatusBadge>
          </div>
          <div className="settings-actions">
            <button className="secondary-button" onClick={onLoadDemo} type="button">
              <RefreshCcw size={16} />
              <span>Carregar exemplo</span>
            </button>
            <button className="secondary-button" onClick={onRegenerateAll} type="button">
              <RefreshCcw size={16} />
              <span>Regerar calendários</span>
            </button>
            <button className="danger-button" onClick={onClearData} type="button">
              <Trash2 size={16} />
              <span>Limpar tudo</span>
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Próximas expansões</h2>
          </div>
          <div className="roadmap-grid">
            {roadmap.map((item) => {
              const Icon = item.icon;
              return (
                <div className="roadmap-item" key={item.label}>
                  <Icon size={18} />
                  <strong>{item.label}</strong>
                  <span>{item.status}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </section>
  );
}
