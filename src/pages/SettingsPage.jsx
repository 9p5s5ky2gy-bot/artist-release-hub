import { Bell, Cloud, Database, FileText, LockKeyhole, LogOut, RefreshCcw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

const roadmap = [
  { label: 'Login', icon: LockKeyhole, status: 'ativo' },
  { label: 'Supabase', icon: Database, status: 'ativo' },
  { label: 'GitHub Pages', icon: Cloud, status: 'pronto' },
  { label: 'PDF', icon: FileText, status: 'planejado' },
  { label: 'Upload de capa', icon: Upload, status: 'planejado' },
  { label: 'Notificações', icon: Bell, status: 'planejado' },
];

function formatSavedAt(value) {
  if (!value) return 'Aguardando primeiro salvamento';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getCloudTone(cloudState) {
  if (cloudState?.error) return 'red';
  if (cloudState?.saving) return 'yellow';
  return 'mint';
}

function getCloudText(isCloudConfigured, cloudState) {
  if (!isCloudConfigured) return 'localStorage';
  if (cloudState?.error) return 'erro';
  if (cloudState?.saving) return 'salvando';
  return 'online';
}

export function SettingsPage({
  artists,
  releases,
  tasks,
  planDays,
  cloudState,
  userEmail,
  isCloudConfigured,
  onSignOut,
  onLoadDemo,
  onClearData,
  onRegenerateAll,
}) {
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
            <h2>{isCloudConfigured ? 'Dados em nuvem' : 'Dados locais'}</h2>
            <StatusBadge tone={getCloudTone(cloudState)}>{getCloudText(isCloudConfigured, cloudState)}</StatusBadge>
          </div>

          <div className="cloud-details">
            <span><ShieldCheck size={16} /> Conta: <strong>{userEmail || 'modo local'}</strong></span>
            <span><Cloud size={16} /> Último salvamento: <strong>{formatSavedAt(cloudState?.lastSaved)}</strong></span>
            {cloudState?.error && <span className="cloud-error"><Database size={16} /> {cloudState.error}</span>}
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
            {isCloudConfigured && userEmail && (
              <button className="secondary-button" onClick={onSignOut} type="button">
                <LogOut size={16} />
                <span>Sair da conta</span>
              </button>
            )}
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
