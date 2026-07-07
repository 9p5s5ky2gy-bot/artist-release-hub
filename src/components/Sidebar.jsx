import {
  BadgeCheck,
  CalendarDays,
  CheckSquare,
  Disc3,
  LayoutDashboard,
  Link2,
  Menu,
  Mic2,
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
      { id: 'tasks', label: 'Dias', icon: CheckSquare },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { id: 'artists', label: 'Artistas', icon: Mic2 },
      { id: 'releases', label: 'Lançamentos', icon: Disc3 },
      { id: 'links', label: 'Links', icon: Link2 },
    ],
  },
  {
    label: 'Sistema',
    items: [{ id: 'settings', label: 'Configurações', icon: Settings }],
  },
];

export function Sidebar({ activePage, onChangePage, mobileOpen, setMobileOpen }) {
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
            <span>Music marketing OS</span>
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
            <span>Dados locais</span>
          </div>
          <strong>Pronto para evoluir</strong>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" type="button" />}
    </>
  );
}

