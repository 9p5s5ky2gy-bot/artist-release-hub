import { AlertTriangle, Database, LogOut, RefreshCcw } from 'lucide-react';

export function CloudSetupPage({ error, onRetry, onSignOut }) {
  return (
    <main className="auth-shell">
      <section className="auth-card setup-card">
        <div className="brand-mark auth-brand warning-brand">
          <AlertTriangle size={22} />
        </div>
        <span className="eyebrow">Configuração pendente</span>
        <h1>Falta criar a tabela no Supabase</h1>
        <p>
          O login já está conectado, mas o banco ainda precisa receber o SQL do arquivo `supabase/schema.sql`.
        </p>
        {error && <code className="setup-error">{error}</code>}
        <div className="settings-actions">
          <button className="secondary-button" onClick={onRetry} type="button">
            <RefreshCcw size={16} />
            <span>Tentar novamente</span>
          </button>
          <button className="secondary-button" onClick={onSignOut} type="button">
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
        <div className="setup-note">
          <Database size={17} />
          <span>Depois de rodar o SQL no Supabase, clique em tentar novamente.</span>
        </div>
      </section>
    </main>
  );
}
