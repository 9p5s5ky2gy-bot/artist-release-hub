import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="auth-shell">
          <section className="auth-card setup-card">
            <span className="eyebrow">Recuperação do painel</span>
            <h1>O painel encontrou um erro de tela</h1>
            <p>Recarregue a página. Seus dados salvos na nuvem/localStorage não serão apagados.</p>
            <code className="setup-error">{this.state.error.message}</code>
            <button className="primary-button" onClick={() => window.location.reload()} type="button">
              Recarregar painel
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
