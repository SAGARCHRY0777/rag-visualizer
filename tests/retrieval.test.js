import test from 'node:test'
import assert from 'node:assert/strict'

import {
  tokenize,
  contentTokens,
  splitSentences,
  embedToken,
  embedText,
  cosineSim,
  bm25,
  maxSim,
  crossEncoderScore,
  rrf,
  RRF_K,
  rankBy,
  fuseRRF,
  EMBED_DIMS,
} from '../src/lib/retrieval.js'

/* ----------------------------------------------------------------- fixtures */

const IMMUNE_MEMORY = 'Memory B cells keep the antibody blueprint after a viral infection clears.'
const VACCINE = 'A vaccine trains the immune system to recognise a virus without causing illness.'
const MARKETS = 'The fund rebalanced its portfolio of bank stocks before the earnings call.'

const DOCS = [
  { id: 'immune-memory', text: IMMUNE_MEMORY },
  { id: 'vaccine', text: VACCINE },
  { id: 'markets', text: MARKETS },
]

const QUERY = 'How does the immune system remember a virus?'

const magnitude = vec => Math.sqrt(vec.reduce((s, v) => s + v * v, 0))

/* ------------------------------------------------------------- tokenisation */

test('tokenize lowercases and strips punctuation', () => {
  assert.deepEqual(
    tokenize('How does the T-cell, really, WORK?!'),
    ['how', 'does', 'the', 't-cell', 'really', 'work'],
  )
  // Punctuation-only input yields no tokens rather than throwing.
  assert.deepEqual(tokenize('  ...  ?! '), [])
})

test('contentTokens drops stopwords and single characters', () => {
  assert.deepEqual(contentTokens(QUERY), ['immune', 'system', 'remember', 'virus'])
  // "the"/"does"/"how" are stopwords; the bare "b" is a 1-char token.
  assert.deepEqual(contentTokens('How does the B cell work'), ['cell', 'work'])
  assert.deepEqual(contentTokens('the of and is it'), [])
})

/* ------------------------------------------------------------ sentence split */

test('splitSentences splits on . ! ? and keeps an unterminated tail', () => {
  assert.deepEqual(splitSentences('One. Two! Three'), ['One.', 'Two!', 'Three'])
  assert.deepEqual(
    splitSentences('Antibodies bind the virus.  Do they persist? Yes!! Memory cells remain'),
    ['Antibodies bind the virus.', 'Do they persist?', 'Yes!!', 'Memory cells remain'],
  )
  assert.deepEqual(splitSentences(''), [])
  assert.deepEqual(splitSentences('   \n\t  '), [])
})

/* ------------------------------------------------------------------ vectors */

test('embedToken is a deterministic, non-negative unit vector', () => {
  const a = embedToken('antibody')
  const b = embedToken('antibody')

  assert.equal(a.length, EMBED_DIMS)
  assert.ok(Math.abs(magnitude(a) - 1) < 1e-12, `expected unit length, got ${magnitude(a)}`)
  assert.deepEqual(a, b, 'repeated calls must return the same vector')
  assert.ok(a.every(v => v >= 0), 'components must be non-negative so cosine stays in [0, 1]')
  assert.ok(a.every(Number.isFinite), 'no NaN/Infinity components')
  // Case-insensitive: the token is lowercased before hashing.
  assert.deepEqual(embedToken('Antibody'), a)
})

test('morphologically related tokens score far above unrelated ones', () => {
  const related = cosineSim(embedToken('viral'), embedToken('virus'))
  const unrelated = cosineSim(embedToken('virus'), embedToken('stocks'))

  assert.ok(related > 0.2, `viral~virus should exceed 0.2, got ${related}`)
  assert.ok(unrelated < 0.05, `virus~stocks should be near zero, got ${unrelated}`)
  assert.ok(related > unrelated)
  // Cosine of a non-negative vector with itself is exactly 1.
  assert.ok(Math.abs(cosineSim(embedToken('virus'), embedToken('virus')) - 1) < 1e-12)
})

test('cosineSim returns 0 for a zero vector instead of NaN', () => {
  const zero = new Array(EMBED_DIMS).fill(0)
  const v = embedToken('portfolio')

  assert.equal(cosineSim(zero, v), 0)
  assert.equal(cosineSim(v, zero), 0)
  assert.equal(cosineSim(zero, zero), 0)
})

test('embedText returns a zero vector for empty or stopword-only text', () => {
  for (const text of ['', '   ', 'the of and is it a']) {
    const vec = embedText(text)
    assert.equal(vec.length, EMBED_DIMS)
    assert.ok(vec.every(v => v === 0), `expected all zeros for ${JSON.stringify(text)}`)
  }
  // Real text produces a unit vector, and the zero case still cosines to 0.
  const real = embedText(VACCINE)
  assert.ok(Math.abs(magnitude(real) - 1) < 1e-12)
  assert.equal(cosineSim(embedText(''), real), 0)
})

/* --------------------------------------------------------------------- BM25 */

test('bm25 scores term-matching documents above non-matching ones', () => {
  const results = bm25(QUERY, DOCS)
  assert.equal(results.length, DOCS.length)

  const byId = Object.fromEntries(results.map(r => [r.id, r]))
  assert.ok(
    byId.vaccine.score > byId.markets.score,
    'the document containing immune/system/virus must outrank the finance document',
  )
  assert.equal(byId.markets.score, 0, 'a document sharing no query term scores 0')

  for (const r of results) {
    assert.ok(Number.isFinite(r.score), `score must be finite, got ${r.score}`)
    assert.ok(Array.isArray(r.terms))
    assert.deepEqual(r.terms.map(t => t.term), ['immune', 'system', 'remember', 'virus'])
    for (const t of r.terms) {
      assert.ok(Number.isFinite(t.idf) && Number.isFinite(t.contribution))
    }
    // The reported score is exactly the sum of the per-term contributions.
    const summed = r.terms.reduce((s, t) => s + t.contribution, 0)
    assert.ok(Math.abs(r.score - summed) < 1e-12)
  }

  // "remember" appears in no document: tf 0, so it contributes nothing anywhere.
  const remember = results.flatMap(r => r.terms.filter(t => t.term === 'remember'))
  assert.equal(remember.length, DOCS.length)
  assert.ok(remember.every(t => t.tf === 0 && t.contribution === 0))
})

/* ------------------------------------------------------------------ ColBERT */

test('maxSim totals, means and matched tokens are internally consistent', () => {
  const { perToken, total, mean, docTokens } = maxSim(QUERY, VACCINE)

  assert.equal(perToken.length, contentTokens(QUERY).length)
  assert.deepEqual(docTokens, tokenize(VACCINE))

  const summed = perToken.reduce((s, p) => s + p.sim, 0)
  assert.ok(Math.abs(total - summed) < 1e-12, 'total must equal the sum of per-token maxima')
  assert.ok(Math.abs(mean - total / perToken.length) < 1e-12, 'mean must equal total / |query|')

  for (const p of perToken) {
    assert.equal(p.sims.length, docTokens.length)
    assert.equal(p.sim, Math.max(...p.sims), `${p.queryToken} sim must be the max over doc tokens`)
    assert.equal(p.matchedToken, docTokens[p.matchedIndex])
    assert.ok(p.sim >= 0 && p.sim <= 1 + 1e-12)
  }

  // Exact overlaps saturate at 1.0.
  const virus = perToken.find(p => p.queryToken === 'virus')
  assert.equal(virus.matchedToken, 'virus')
  assert.ok(Math.abs(virus.sim - 1) < 1e-12)
})

test('maxSim returns zeros when the query has no content tokens', () => {
  const empty = maxSim('the a of', VACCINE)
  assert.deepEqual(empty.perToken, [])
  assert.equal(empty.total, 0)
  assert.equal(empty.mean, 0, 'mean must be 0, not NaN, for an empty query')

  const noDoc = maxSim(QUERY, '')
  assert.deepEqual(noDoc.perToken, [])
  assert.equal(noDoc.total, 0)
  assert.equal(noDoc.mean, 0)
})

/* ----------------------------------------------------------- cross-encoder */

test('crossEncoderScore stays inside (0, 1) and prefers the on-topic document', () => {
  const onTopic = crossEncoderScore(QUERY, VACCINE)
  const related = crossEncoderScore(QUERY, IMMUNE_MEMORY)
  const offTopic = crossEncoderScore(QUERY, MARKETS)

  for (const s of [onTopic, related, offTopic, crossEncoderScore('', MARKETS)]) {
    assert.ok(Number.isFinite(s))
    assert.ok(s > 0 && s < 1, `score must be strictly inside [0, 1], got ${s}`)
  }
  assert.ok(onTopic > offTopic, `on-topic ${onTopic} should beat off-topic ${offTopic}`)
  assert.ok(related > offTopic, `immunology prose ${related} should beat finance ${offTopic}`)
})

/* ---------------------------------------------------------------------- RRF */

test('rrf, rankBy and fuseRRF implement reciprocal rank fusion exactly', () => {
  assert.equal(rrf(1), 1 / (RRF_K + 1))
  assert.equal(rrf(3, 10), 1 / 13)
  assert.ok(rrf(1) > rrf(2), 'earlier ranks contribute more')

  const ranked = rankBy(
    [{ id: 'markets', s: 2 }, { id: 'vaccine', s: 9 }, { id: 'immune-memory', s: 5 }],
    x => x.s,
  )
  assert.deepEqual(ranked.map(r => r.id), ['vaccine', 'immune-memory', 'markets'])
  assert.deepEqual(ranked.map(r => r.rank), [1, 2, 3])

  const fused = fuseRRF(
    ['vaccine', 'immune-memory'],
    [
      { label: 'bm25', ranks: { vaccine: 1, 'immune-memory': 2 } },
      { label: 'vector', ranks: { 'immune-memory': 1 } },
    ],
  )
  const byId = Object.fromEntries(fused.map(f => [f.id, f]))

  assert.equal(byId.vaccine.score, rrf(1))
  assert.equal(byId.vaccine.parts[1].contribution, 0, 'absence from a list contributes 0')
  assert.equal(byId['immune-memory'].score, rrf(2) + rrf(1))
  assert.deepEqual(byId.vaccine.parts.map(p => p.label), ['bm25', 'vector'])
  assert.ok(byId['immune-memory'].score > byId.vaccine.score, 'appearing in both lists wins')
})
