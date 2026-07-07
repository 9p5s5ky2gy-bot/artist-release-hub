export function StatCard({ label, value, icon: Icon, tone = 'mint', meta }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <div className="stat-icon">{Icon && <Icon size={20} />}</div>
        {meta && <small>{meta}</small>}
      </div>
      <div className="stat-card-main">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}
