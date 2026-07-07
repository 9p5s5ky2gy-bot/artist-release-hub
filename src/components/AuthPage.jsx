import { LockKeyhole, Mail, Music2, ShieldCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';

export function AuthPage({ configured, loading, authError, onSignIn, onSignUp, onResendConfirmation }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setCanResendConfirmation(false);

    try {
      if (mode === 'signup') {
        await onSignUp(email.trim(), password);
        setCanResendConfirmation(true);
        setMessage('Conta criada. Enviamos o link de confirmação para o seu e-mail. Confira também spam, promoções e lixo eletrônico.');
      } else {
        await onSignIn(email.trim(), password);
        setCanResendConfirmation(false);
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível entrar agora.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!onResendConfirmation || !email.trim()) return;

    setResending(true);
    setMessage('');

    try {
      await onResendConfirmation(email.trim());
      setCanResendConfirmation(true);
      setMessage('Novo link de confirmação enviado. Confira sua caixa de entrada, spam, promoções e lixo eletrônico.');
    } catch (error) {
      setMessage(error.message || 'Não foi possível reenviar o link agora.');
    } finally {
      setResending(false);
    }
  }

  if (!configured) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="brand-mark auth-brand">
            <Music2 size={22} />
          </div>
          <h1>Supabase ainda não configurado</h1>
          <p>Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para ativar login e dados em nuvem.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand-mark auth-brand">
          <Music2 size={22} />
        </div>
        <span className="eyebrow">Artist Release Hub Cloud</span>
        <h1>Seu calendário musical salvo na nuvem.</h1>
        <p>
          Entre com e-mail e senha para acessar artistas, lançamentos, links e dias concluídos em qualquer computador ou celular.
        </p>
        <div className="auth-benefits">
          <span><ShieldCheck size={16} /> Dados separados por usuário</span>
          <span><LockKeyhole size={16} /> Login com Supabase Auth</span>
          <span><Music2 size={16} /> Planejamento de pré-save e lançamento</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Login">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')} type="button">
            Entrar
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')} type="button">
            Criar conta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <span className="input-with-icon">
              <Mail size={16} />
              <input
                autoComplete="email"
                disabled={loading || submitting}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                required
                type="email"
                value={email}
              />
            </span>
          </label>

          <label>
            Senha
            <span className="input-with-icon">
              <LockKeyhole size={16} />
              <input
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                disabled={loading || submitting}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="mínimo 6 caracteres"
                required
                type="password"
                value={password}
              />
            </span>
          </label>

          <button className="primary-button auth-submit" disabled={loading || submitting} type="submit">
            {mode === 'signup' ? <UserPlus size={17} /> : <LockKeyhole size={17} />}
            <span>{submitting || loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}</span>
          </button>
        </form>

        {(authError || message) && <p className={authError ? 'auth-message is-error' : 'auth-message'}>{authError || message}</p>}

        {mode === 'signup' && canResendConfirmation && onResendConfirmation && (
          <button
            className="secondary-button auth-resend-button"
            disabled={loading || submitting || resending}
            onClick={handleResendConfirmation}
            type="button"
          >
            <Mail size={16} />
            <span>{resending ? 'Reenviando...' : 'Reenviar link de confirmação'}</span>
          </button>
        )}
      </section>
    </main>
  );
}
