// Text matching used by the two "find my renamed subject" features.
//  - matchByName:     old/alternative name -> subjects (token overlap)
//  - matchBySyllabus: pasted syllabus      -> top N subjects (TF-IDF cosine)

const STOPWORDS = new Set(
  'the and for with from that this are was were its into their than then also such used using use based include includes including etc unit basic introduction concepts types type'.split(' ')
);

const tokenize = (text = '') =>
  (text.toLowerCase().match(/[a-z0-9+#]{3,}/g) || []).filter((w) => !STOPWORDS.has(w));

const subjectText = (s) =>
  `${s.name} ${s.name} ${Object.values(s.units || {}).join(' ')}`;

// ---------- by name ----------
export const matchByName = (query, subjects, limit = 10) => {
  const q = tokenize(query);
  if (!q.length) return [];
  return subjects
    .map((s) => {
      const haystack = new Set(tokenize([s.name, ...(s.aliases || [])].join(' ')));
      const hits = q.filter((w) => haystack.has(w)).length;
      return { subject: s, score: hits / q.length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => ({ ...r.subject, score: Number(r.score.toFixed(2)) }));
};

// ---------- by syllabus (TF-IDF + cosine similarity) ----------
export const matchBySyllabus = (syllabusText, subjects, limit = 5) => {
  const docs = subjects.map((s) => tokenize(subjectText(s)));
  const df = new Map();
  docs.forEach((tokens) => new Set(tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  const idf = (t) => Math.log((1 + docs.length) / (1 + (df.get(t) || 0))) + 1;

  const vectorize = (tokens) => {
    const tf = new Map();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Map();
    let norm = 0;
    tf.forEach((count, t) => {
      const w = count * idf(t);
      vec.set(t, w);
      norm += w * w;
    });
    return { vec, norm: Math.sqrt(norm) };
  };

  const query = vectorize(tokenize(syllabusText));
  if (!query.norm) return [];

  return subjects
    .map((s, i) => {
      const doc = vectorize(docs[i]);
      let dot = 0;
      query.vec.forEach((w, t) => {
        if (doc.vec.has(t)) dot += w * doc.vec.get(t);
      });
      const score = doc.norm ? dot / (query.norm * doc.norm) : 0;
      return { ...s, score: Number(score.toFixed(3)) };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
