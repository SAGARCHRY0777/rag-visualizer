/**
 * Dependency-free stand-ins for the models a real RAG stack would call out to.
 *
 * Everything here runs in the browser on whatever text the user types, so the
 * views stay live instead of replaying canned numbers. The embeddings are a
 * hashed character-trigram bag rather than a trained model: words that share
 * substrings ("viral" / "virus") land near each other, which is enough to
 * demonstrate the behaviour each retrieval method is known for. BM25 and RRF,
 * by contrast, are the real formulas — they need no model to be exact.
 */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'do', 'does',
  'for', 'from', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is',
  'it', 'its', 'of', 'on', 'or', 'that', 'the', 'their', 'then', 'there',
  'these', 'they', 'this', 'to', 'was', 'were', 'what', 'when', 'which', 'who',
  'why', 'will', 'with', 'you', 'your',
])

export const EMBED_DIMS = 256

/** Lowercased word tokens, punctuation stripped. */
export function tokenize(text) {
  return (String(text).toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [])
}

/** Tokens minus stopwords and single characters — what actually carries meaning. */
export function contentTokens(text) {
  return tokenize(text).filter(t => t.length > 1 && !STOPWORDS.has(t))
}

/** Split on sentence-ending punctuation, keeping a trailing fragment if unterminated. */
export function splitSentences(text) {
  const trimmed = String(text).trim()
  if (!trimmed) return []
  const matched = trimmed.match(/[^.!?]+[.!?]+/g) ?? []
  const consumed = matched.join('').length
  const tail = trimmed.slice(consumed).trim()
  const out = matched.map(s => s.trim()).filter(Boolean)
  if (tail) out.push(tail)
  return out
}

/** FNV-1a — small, fast, and stable across reloads so scores never drift. */
function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Character trigrams of a padded token. The padding marks word boundaries so
 * prefixes and suffixes are features in their own right.
 */
function trigrams(token) {
  const padded = `#${token}#`
  if (padded.length < 3) return [padded]
  const out = []
  for (let i = 0; i + 3 <= padded.length; i++) out.push(padded.slice(i, i + 3))
  return out
}

function normalise(vec) {
  let sum = 0
  for (const v of vec) sum += v * v
  const mag = Math.sqrt(sum)
  if (mag === 0) return vec
  return vec.map(v => v / mag)
}

const tokenVectorCache = new Map()

/** Unit-length vector for a single token. Non-negative, so cosine stays in [0, 1]. */
export function embedToken(token) {
  const key = token.toLowerCase()
  const cached = tokenVectorCache.get(key)
  if (cached) return cached
  const vec = new Array(EMBED_DIMS).fill(0)
  for (const gram of trigrams(key)) {
    vec[hash(gram) % EMBED_DIMS] += 1
  }
  const unit = normalise(vec)
  tokenVectorCache.set(key, unit)
  return unit
}

/** Mean of the content-token vectors — the single-vector view a bi-encoder produces. */
export function embedText(text) {
  const tokens = contentTokens(text)
  if (!tokens.length) return new Array(EMBED_DIMS).fill(0)
  const acc = new Array(EMBED_DIMS).fill(0)
  for (const t of tokens) {
    const v = embedToken(t)
    for (let i = 0; i < EMBED_DIMS; i++) acc[i] += v[i]
  }
  return normalise(acc)
}

export function cosineSim(a, b) {
  let dot = 0
  let ma = 0
  let mb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    ma += a[i] * a[i]
    mb += b[i] * b[i]
  }
  if (ma === 0 || mb === 0) return 0
  return dot / (Math.sqrt(ma) * Math.sqrt(mb))
}

/**
 * A low-dimensional projection of a vector, purely so it can be drawn as a
 * strip of bars. Adjacent dimensions are summed into `buckets` groups.
 */
export function projectVector(vec, buckets = 24) {
  const size = Math.ceil(vec.length / buckets)
  const out = []
  for (let i = 0; i < buckets; i++) {
    let sum = 0
    for (let j = i * size; j < Math.min((i + 1) * size, vec.length); j++) sum += vec[j]
    out.push(sum)
  }
  const max = Math.max(...out, 1e-9)
  return out.map(v => v / max)
}

/* ------------------------------------------------------------------ BM25 */

export const BM25_PARAMS = { k1: 1.5, b: 0.75 }

/**
 * Textbook BM25 over an in-memory document set. Returns one entry per document
 * with its score and the per-term contributions, so the UI can show *why* a
 * document scored what it did.
 */
export function bm25(query, docs, { k1, b } = BM25_PARAMS) {
  const docTokens = docs.map(d => tokenize(d.text))
  const lengths = docTokens.map(t => t.length)
  const avgLen = lengths.reduce((s, l) => s + l, 0) / (lengths.length || 1)
  const queryTerms = [...new Set(contentTokens(query))]

  const docFreq = new Map()
  for (const term of queryTerms) {
    docFreq.set(term, docTokens.filter(tokens => tokens.includes(term)).length)
  }

  return docs.map((doc, i) => {
    const tokens = docTokens[i]
    const terms = queryTerms.map(term => {
      const tf = tokens.filter(t => t === term).length
      const n = docFreq.get(term) ?? 0
      // BM25 IDF, the +1 keeping it positive even for terms in every document.
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5))
      const norm = tf === 0
        ? 0
        : (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (lengths[i] / (avgLen || 1))))
      return { term, tf, idf, contribution: idf * norm }
    })
    const score = terms.reduce((s, t) => s + t.contribution, 0)
    return { ...doc, score, terms, length: lengths[i] }
  })
}

/* --------------------------------------------------------------- ColBERT */

/**
 * MaxSim: for every query token, the best-matching document token. The ColBERT
 * score is the sum of those maxima; the mean is reported alongside because it
 * is comparable across queries of different lengths.
 */
export function maxSim(query, docText) {
  const queryTokens = contentTokens(query)
  const docTokens = tokenize(docText)
  if (!queryTokens.length || !docTokens.length) {
    return { perToken: [], total: 0, mean: 0, docTokens }
  }
  const docVecs = docTokens.map(embedToken)
  const perToken = queryTokens.map(queryToken => {
    const qv = embedToken(queryToken)
    const sims = docVecs.map(dv => cosineSim(qv, dv))
    let best = 0
    for (let i = 1; i < sims.length; i++) if (sims[i] > sims[best]) best = i
    return {
      queryToken,
      sims,
      sim: sims[best],
      matchedToken: docTokens[best],
      matchedIndex: best,
    }
  })
  const total = perToken.reduce((s, p) => s + p.sim, 0)
  return { perToken, total, mean: total / queryTokens.length, docTokens }
}

/* --------------------------------------------------- Cross-encoder (sim.) */

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

/**
 * A stand-in for a joint query+document transformer. A real cross-encoder sees
 * both sequences in the same attention layers; this approximates that by
 * rewarding per-token soft matches (which catch paraphrase) more heavily than
 * whole-document cosine, then squashing to [0, 1] the way a trained reranker's
 * sigmoid head does. Directionally right, not a trained model.
 */
export function crossEncoderScore(query, docText) {
  const { mean } = maxSim(query, docText)
  const docCosine = cosineSim(embedText(query), embedText(docText))
  const queryTerms = new Set(contentTokens(query))
  const docTerms = new Set(contentTokens(docText))
  const exact = queryTerms.size
    ? [...queryTerms].filter(t => docTerms.has(t)).length / queryTerms.size
    : 0
  const blended = 0.55 * mean + 0.25 * docCosine + 0.20 * exact
  return sigmoid(9 * (blended - 0.42))
}

/* ------------------------------------------------------------------- RRF */

export const RRF_K = 60

export function rrf(rank, k = RRF_K) {
  return 1 / (k + rank)
}

/** Dense-ranking helper: 1-based ranks after sorting descending by `key`. */
export function rankBy(items, key) {
  return [...items]
    .sort((a, b) => key(b) - key(a))
    .map((item, i) => ({ ...item, rank: i + 1 }))
}

/**
 * Fuse any number of ranked lists with Reciprocal Rank Fusion. Each list is
 * `{ label, ranks }` where `ranks` maps document id to its 1-based rank.
 */
export function fuseRRF(ids, lists, k = RRF_K) {
  return ids.map(id => {
    const parts = lists.map(list => ({
      label: list.label,
      rank: list.ranks[id],
      contribution: list.ranks[id] ? rrf(list.ranks[id], k) : 0,
    }))
    return { id, parts, score: parts.reduce((s, p) => s + p.contribution, 0) }
  })
}
