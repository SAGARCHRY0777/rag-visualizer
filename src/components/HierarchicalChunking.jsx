import { useMemo, useState } from 'react'
import { CHUNK_COLORS } from '../data/palette'
import { useCorpus } from '../state/CorpusContext'
import { ChunkCard, Badge, Card, Label, SectionHeader, SliderRow, ScoreBar } from './UI'
import { DocumentInput, QueryPanel, EmptyState } from './Inputs'
import { cosineSim, embedText } from '../lib/retrieval'

/**
 * Cut the sentence sequence at its `cuts` weakest adjacent similarities. This
 * is agglomerative clustering constrained to keep parents contiguous, which is
 * what RAPTOR-style trees do when they preserve reading order.
 */
function buildParents(sentences, sims, cuts) {
  if (!sentences.length) return []
  const boundaries = sims
    .map((sim, i) => ({ sim, i }))
    .sort((a, b) => a.sim - b.sim)
    .slice(0, Math.max(0, cuts))
    .map(b => b.i)

  const groups = []
  let current = [0]
  for (let i = 1; i < sentences.length; i++) {
    if (boundaries.includes(i - 1)) {
      groups.push(current)
      current = [i]
    } else {
      current.push(i)
    }
  }
  groups.push(current)
  return groups
}

/**
 * Extractive summary: the sentence closest to the group's centroid. A real
 * RAPTOR implementation asks an LLM to write an abstractive summary here — the
 * most central sentence is the honest offline equivalent.
 */
function centroidSentence(indices, sentences, vectors) {
  if (indices.length === 1) return indices[0]
  const dims = vectors[indices[0]].length
  const centroid = new Array(dims).fill(0)
  for (const i of indices) {
    for (let d = 0; d < dims; d++) centroid[d] += vectors[i][d]
  }
  let best = indices[0]
  let bestScore = -Infinity
  for (const i of indices) {
    const score = cosineSim(centroid, vectors[i])
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  }
  return best
}

export default function HierarchicalChunking() {
  const { sentences, query } = useCorpus()
  const [cuts, setCuts] = useState(2)
  const [expanded, setExpanded] = useState(0)

  const vectors = useMemo(() => sentences.map(embedText), [sentences])
  const sims = useMemo(
    () => vectors.slice(0, -1).map((v, i) => cosineSim(v, vectors[i + 1])),
    [vectors],
  )

  const maxCuts = Math.max(1, sentences.length - 1)
  const effectiveCuts = Math.min(cuts, maxCuts)
  const groups = useMemo(
    () => buildParents(sentences, sims, effectiveCuts),
    [sentences, sims, effectiveCuts],
  )

  const parents = useMemo(() => groups.map((indices, pi) => {
    const dims = vectors[0]?.length ?? 0
    const centroid = new Array(dims).fill(0)
    for (const i of indices) {
      for (let d = 0; d < dims; d++) centroid[d] += vectors[i][d]
    }
    return {
      indices,
      color: CHUNK_COLORS[pi % CHUNK_COLORS.length],
      summaryIndex: centroidSentence(indices, sentences, vectors),
      vector: centroid,
    }
  }), [groups, sentences, vectors])

  // Level-2 search: score the parent summaries, then drill into the winner's
  // leaves. This is the whole point of a hierarchical index — two small
  // searches instead of one big one.
  const drill = useMemo(() => {
    if (!query.trim() || !parents.length) return null
    const qv = embedText(query)
    const parentScores = parents.map((p, i) => ({ i, score: cosineSim(qv, p.vector) }))
      .sort((a, b) => b.score - a.score)
    const winner = parentScores[0]
    const leafScores = parents[winner.i].indices
      .map(si => ({ si, score: cosineSim(qv, vectors[si]) }))
      .sort((a, b) => b.score - a.score)
    return { parentScores, winner, leafScores }
  }, [query, parents, vectors])

  if (!sentences.length) {
    return (
      <div>
        <SectionHeader
          title="Hierarchical / RAPTOR chunking"
          description="Leaf chunks are clustered by similarity and summarised into parent nodes, so a query can be answered at whichever level of detail it needs."
        />
        <DocumentInput />
        <EmptyState>Add some text above to build a chunk tree.</EmptyState>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Hierarchical / RAPTOR chunking"
        description="Leaf chunks are clustered into parents by cutting the document at its weakest similarity boundaries. Each parent is represented by its most central sentence — a real RAPTOR tree would have an LLM write that summary. At query time you search parents first, then drill into only the winning branch."
      />

      <DocumentInput />

      <SliderRow
        label="Tree cuts"
        min={1} max={maxCuts} value={effectiveCuts}
        onChange={setCuts}
        hint={`→ ${parents.length} parent${parents.length === 1 ? '' : 's'} over ${sentences.length} leaves`}
      />

      <Label>Level 2 — parent nodes (broad context)</Label>
      {parents.map((p, pi) => {
        const isOpen = expanded === pi
        const isWinner = drill?.winner.i === pi
        return (
          <div key={pi}>
            <ChunkCard
              borderColor={p.color.border}
              style={isWinner ? { boxShadow: `inset 0 0 0 1px ${p.color.border}55` } : undefined}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : pi)}
                aria-expanded={isOpen}
                className="tree-toggle"
              >
                <span style={{ textAlign: 'left' }}>
                  <Badge color={p.color.badge.text} bg={p.color.badge.bg}>Parent {pi + 1}</Badge>
                  <Badge color="var(--text3)" bg="var(--tint)">
                    {p.indices.length} leaf chunk{p.indices.length === 1 ? '' : 's'}
                  </Badge>
                  {isWinner && (
                    <Badge color="var(--teal)" bg="var(--c2-bg)">✓ query match</Badge>
                  )}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>
                {sentences[p.summaryIndex]}
              </div>

              {isOpen && (
                <div style={{ marginTop: 10, paddingLeft: 14, borderLeft: '1px dashed var(--border2)' }}>
                  <Label>Level 1 — leaf chunks</Label>
                  {p.indices.map((si, li) => (
                    <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: p.color.badge.text, fontFamily: 'var(--mono)', marginTop: 3, flexShrink: 0 }}>
                        P{pi + 1}·L{li + 1}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>{sentences[si]}</span>
                    </div>
                  ))}
                </div>
              )}
            </ChunkCard>
          </div>
        )
      })}

      <QueryPanel showDocs={false} />

      {drill && (
        <Card>
          <Label>Query-time drill-down</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Step n={1} text="Embed the query and search parent summaries only">
              {drill.parentScores.map(ps => (
                <div key={ps.i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', minWidth: 62 }}>
                    Parent {ps.i + 1}
                  </span>
                  <ScoreBar
                    score={ps.score}
                    color={ps.i === drill.winner.i ? 'var(--c2)' : 'var(--text3)'}
                  />
                </div>
              ))}
            </Step>

            <Step n={2} text={`Drill into Parent ${drill.winner.i + 1} only — the other branches are never scored`}>
              {drill.leafScores.map(ls => (
                <div key={ls.si} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', minWidth: 62 }}>
                    S{ls.si + 1}
                  </span>
                  <ScoreBar score={ls.score} color={ls === drill.leafScores[0] ? 'var(--c1)' : 'var(--text3)'} />
                </div>
              ))}
            </Step>

            <Step n={3} text="Return the parent summary plus the winning leaf as context">
              <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 4, lineHeight: 1.6 }}>
                “{sentences[parents[drill.winner.i].summaryIndex]}” +{' '}
                “{sentences[drill.leafScores[0].si]}”
              </div>
            </Step>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12, lineHeight: 1.6 }}>
            Only {parents.length} parent comparisons plus{' '}
            {parents[drill.winner.i].indices.length} leaf comparisons were needed,
            instead of scoring all {sentences.length} leaves — the saving grows with
            corpus size.
          </p>
        </Card>
      )}
    </div>
  )
}

function Step({ n, text, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 6, background: 'var(--bg4)' }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent2)', minWidth: 18 }}>{n}.</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{text}</div>
        {children}
      </div>
    </div>
  )
}
