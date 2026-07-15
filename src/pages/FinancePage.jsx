import { DollarSign, Plus, Save, Trash2, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { createId } from '../utils/id';
import { defaultExpenseCategories, defaultRevenueCategories, financeExpenseStatuses, formatCurrency, getReleaseFinance, parseMoney, summarizeFinance } from '../utils/proModules';

const emptyExpense = { description: '', category: 'outros', plannedValue: '', realValue: '', date: '', supplier: '', status: 'planejado', paid: false, paymentMethod: '', note: '' };
const emptyRevenue = { description: '', category: 'streams', value: '', date: '', confirmed: false, note: '' };

export function FinancePage({ artists, releases, onPatchRelease, onDeleteFinanceItem, onNavigate }) {
  const [artistId, setArtistId] = useState(artists[0]?.id || '');
  const artistReleases = useMemo(() => releases.filter((release) => !artistId || release.artistId === artistId), [releases, artistId]);
  const [releaseId, setReleaseId] = useState(artistReleases[0]?.id || releases[0]?.id || '');
  const [expense, setExpense] = useState(emptyExpense);
  const [revenue, setRevenue] = useState(emptyRevenue);

  useEffect(() => { if (artists.length && !artists.some((artist) => artist.id === artistId)) setArtistId(artists[0].id); }, [artists, artistId]);
  useEffect(() => { const available = releases.filter((release) => !artistId || release.artistId === artistId); if (available.length && !available.some((release) => release.id === releaseId)) setReleaseId(available[0].id); }, [releases, artistId, releaseId]);

  const release = releases.find((item) => item.id === releaseId) || {};
  const finance = getReleaseFinance(release);
  const summary = summarizeFinance(release);

  function patchFinance(patch) {
    onPatchRelease(release.id, { finance: { ...finance, ...patch, updatedAt: new Date().toISOString() } });
  }

  function updateBudget(field, value) {
    patchFinance({ [field]: parseMoney(value) });
  }

  function addExpense(event) {
    event.preventDefault();
    if (!expense.description.trim()) return;
    patchFinance({ expenses: [{ ...expense, id: createId('expense'), plannedValue: parseMoney(expense.plannedValue), realValue: parseMoney(expense.realValue), createdAt: new Date().toISOString() }, ...finance.expenses] });
    setExpense(emptyExpense);
  }

  function addRevenue(event) {
    event.preventDefault();
    if (!revenue.description.trim()) return;
    patchFinance({ revenues: [{ ...revenue, id: createId('revenue'), value: parseMoney(revenue.value), createdAt: new Date().toISOString() }, ...finance.revenues] });
    setRevenue(emptyRevenue);
  }

  function removeExpense(id) { onDeleteFinanceItem(release.id, 'expenses', id); }
  function removeRevenue(id) { onDeleteFinanceItem(release.id, 'revenues', id); }

  if (!artists.length || !releases.length) return <section className="page-content"><PageHeader eyebrow="Financeiro" title="Gestao financeira" /><EmptyState title="Cadastre artista e lancamento" text="O financeiro e salvo dentro do JSON do lancamento." /></section>;

  return (
    <section className="page-content pro-page">
      <PageHeader eyebrow="Financeiro" title="Financeiro por lancamento"><button className="secondary-button" onClick={() => onNavigate('reports')} type="button">Gerar relatorio financeiro</button></PageHeader>
      <p className="muted-copy">Este recurso serve para organizacao e estimativas internas. Nao substitui controle contabil ou financeiro profissional.</p>

      <section className="pro-selector panel multi">
        <label>Artista<select value={artistId} onChange={(event) => setArtistId(event.target.value)}>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.stageName}</option>)}</select></label>
        <label>Lancamento<select value={releaseId} onChange={(event) => setReleaseId(event.target.value)}>{artistReleases.map((item) => <option key={item.id} value={item.id}>{item.songTitle}</option>)}</select></label>
        <label>Orcamento planejado<input inputMode="decimal" defaultValue={summary.budget || ''} onBlur={(event) => updateBudget('plannedBudget', event.target.value)} placeholder="R$ 0,00" /></label>
        <label>Receita estimada<input inputMode="decimal" defaultValue={finance.estimatedRevenue || ''} onBlur={(event) => updateBudget('estimatedRevenue', event.target.value)} placeholder="R$ 0,00" /></label>
      </section>

      <div className="stats-grid">
        <StatCard label="Orcamento" value={formatCurrency(summary.budget)} icon={WalletCards} tone="mint" />
        <StatCard label="Gasto real" value={formatCurrency(summary.totalSpent)} icon={DollarSign} tone="yellow" />
        <StatCard label="Pendente" value={formatCurrency(summary.totalPending)} icon={DollarSign} tone="coral" />
        <StatCard label="Resultado" value={formatCurrency(summary.result)} icon={DollarSign} tone={summary.result >= 0 ? 'mint' : 'coral'} />
      </div>

      <section className="pro-grid two-columns">
        <article className="panel"><div className="panel-heading"><h2>Adicionar despesa</h2><StatusBadge>{summary.usedPercent}% usado</StatusBadge></div><form className="pro-form-grid" onSubmit={addExpense}><label className="span-2">Descricao<input value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} /></label><label>Categoria<select value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })}>{defaultExpenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Status<select value={expense.status} onChange={(event) => setExpense({ ...expense, status: event.target.value })}>{financeExpenseStatuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Valor planejado<input inputMode="decimal" value={expense.plannedValue} onChange={(event) => setExpense({ ...expense, plannedValue: event.target.value })} /></label><label>Valor real<input inputMode="decimal" value={expense.realValue} onChange={(event) => setExpense({ ...expense, realValue: event.target.value })} /></label><label>Data<input type="date" value={expense.date} onChange={(event) => setExpense({ ...expense, date: event.target.value })} /></label><label>Fornecedor<input value={expense.supplier} onChange={(event) => setExpense({ ...expense, supplier: event.target.value })} /></label><button className="primary-button span-2" type="submit"><Plus size={16} />Adicionar despesa</button></form></article>
        <article className="panel"><div className="panel-heading"><h2>Adicionar receita</h2><StatusBadge>{formatCurrency(summary.totalRevenue)}</StatusBadge></div><form className="pro-form-grid" onSubmit={addRevenue}><label className="span-2">Descricao<input value={revenue.description} onChange={(event) => setRevenue({ ...revenue, description: event.target.value })} /></label><label>Categoria<select value={revenue.category} onChange={(event) => setRevenue({ ...revenue, category: event.target.value })}>{defaultRevenueCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Valor<input inputMode="decimal" value={revenue.value} onChange={(event) => setRevenue({ ...revenue, value: event.target.value })} /></label><label>Data<input type="date" value={revenue.date} onChange={(event) => setRevenue({ ...revenue, date: event.target.value })} /></label><label><input checked={revenue.confirmed} onChange={(event) => setRevenue({ ...revenue, confirmed: event.target.checked })} type="checkbox" /> Confirmado</label><button className="primary-button span-2" type="submit"><Save size={16} />Adicionar receita</button></form></article>
      </section>

      <section className="pro-grid two-columns">
        <article className="panel"><div className="panel-heading"><h2>Despesas</h2><StatusBadge>{finance.expenses.length}</StatusBadge></div><div className="pro-stack">{finance.expenses.map((item) => <div className="finance-row" key={item.id}><div><strong>{item.description}</strong><span>{item.category} · {item.status}</span></div><strong>{formatCurrency(item.realValue || item.plannedValue)}</strong><button className="danger-button compact" onClick={() => removeExpense(item.id)} type="button"><Trash2 size={14} /></button></div>)}</div></article>
        <article className="panel"><div className="panel-heading"><h2>Receitas</h2><StatusBadge>{finance.revenues.length}</StatusBadge></div><div className="pro-stack">{finance.revenues.map((item) => <div className="finance-row" key={item.id}><div><strong>{item.description}</strong><span>{item.category} · {item.confirmed ? 'confirmado' : 'estimado'}</span></div><strong>{formatCurrency(item.value)}</strong><button className="danger-button compact" onClick={() => removeRevenue(item.id)} type="button"><Trash2 size={14} /></button></div>)}</div></article>
      </section>
    </section>
  );
}
