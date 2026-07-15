import {
  BadgeCheck,
  CalendarDays,
  CheckSquare,
  Disc3,
  Eye,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Mic2,
  Send,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';

const navigationGroups = [
  {
    label: 'Operação',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'calendar', label: 'Calendário', icon: CalendarDays },
      { id: 'generalCalendar', label: 'Calendario Geral', icon: CalendarDays },
      { id: 'tasks', label: 'Dias', icon: CheckSquare },
      { id: 'diagnosis', label: 'Diagnostico', icon: Sparkles },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { id: 'artists', label: 'Artistas', icon: Mic2 },
      { id: 'releases', label: 'Lançamentos', icon: Disc3 },
      { id: 'artistView', label: 'Visão do Artista', icon: Eye },
      { id: 'pitching', label: 'Pitching', icon: Send },
      { id: 'finance', label: 'Financeiro', icon: BadgeCheck },
      { id: 'compare', label: 'Comparar', icon: LayoutDashboard },
      { id: 'reports', label: 'Relatorios', icon: Link2 },
      { id: 'links', label: 'Links', icon: Link2 },
    ],
  },
  {
    label: 'Sistema',
    items: [{ id: 'settings', label: 'Configurações', icon: Settings }],
  },
];

function getCloudLabel(isCloudConfigured, cloudState) {
  if (!isCloudConfigured) return 'Dados locais';
  if (cloudState?.saving) return 'Salvando na nuvem';
  if (cloudState?.error) return 'Atenção na nuvem';
  return 'Nuvem ativa';
}

export function Sidebar({
  activePage,
  onChangePage,
  mobileOpen,
  setMobileOpen,
  cloudState,
  isCloudConfigured,
  userEmail,
  onSignOut,
}) {
  return (
    <>
      <button className="mobile-menu-button icon-button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" type="button">
        <Menu size={20} />
      </button>

      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <div className="brand-copy">
            <strong>Artist Release Hub</strong>
            <span>Music marketing OS · v2.1 IA posts</span>
          </div>
          <button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" type="button">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigationGroups.map((group) => (
            <div className="sidebar-group" key={group.label}>
              <span className="sidebar-group-label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={activePage === item.id ? 'active' : ''}
                    onClick={() => {
                      onChangePage(item.id);
                      setMobileOpen(false);
                    }}
                    type="button"
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <BadgeCheck size={16} />
            <span>{getCloudLabel(isCloudConfigured, cloudState)}</span>
          </div>
          <strong>{userEmail || (isCloudConfigured ? 'Supabase conectado' : 'Pronto para evoluir')}</strong>
          {isCloudConfigured && userEmail && (
            <button className="text-button sidebar-logout" onClick={onSignOut} type="button">
              <LogOut size={15} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" type="button" />}
    </>
  );
}
