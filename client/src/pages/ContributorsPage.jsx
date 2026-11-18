const contributors = [
  'Shivanshu Prakash',
  'Yagas Vasisht',
  'Aditya Menon',
];

export default function ContributorsPage() {
  return (
    <section className="contributors-page">
      <div className="contributors-heading">
        <p className="eyebrow">ExamPrep team</p>
        <h1>Contributors</h1>
        <p className="muted">The people who helped build ExamPrep.</p>
      </div>

      <div className="contributors-grid">
        {contributors.map((name, index) => (
          <article className="card contributor-card" key={name} style={{ animationDelay: `${index * 60}ms` }}>
            <span className="contributor-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="contributor-name">
              {name}
              <span>Contributor</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
