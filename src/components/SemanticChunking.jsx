import { useMemo, useState } from 'react'
import { CHUNK_COLORS } from '../data/palette'
import { useCorpus } from '../state/CorpusContext'
import { ChunkCard, Badge, Card, Label, SectionHeader, SliderRow } from './UI'
import { DocumentInput, EmptyState } from './Inputs'
import { cosineSim, embedText, contentTokens } from '../lib/retrieval'

/** Terms that appear in a group but rarely elsewhere — a cheap topic label. */
function topTerms(indices, sentences, limit = 3) {
  const inGroup = new Map()
  const inRest = new Map()
  sentences.forEach((s, i) => {
    const target = indices.includes(i) ? inGroup : inRest
    for (const t of new Set(contentTokens(s))) {
      target.set(t, (target.get(t) ?? 0) + 1)
    }
  })
  return [...inGroup.entries()]
    .map(([term, count]) => ({ term, weight: count / (1 + (inRest.get(term) ?? 0)) }))
    .sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term))
    .slice(0, limit)
    .map(t => t.term)
}

export default function SemanticChunking() {
  const { sentences } = useCorpus()
  // Null until the user moves the slider, so the threshold can track whatever
  // text is loaded. Absolute similarity values differ a lot between corpora —
  // a fixed default would split everything or nothing on most documents.
  const [override, setOverride] = useState(null)

  // Cosine between each adjacent sentence pair. Index i is the boundary
  // between sentence i and i+1.
  const sims = useMemo(() => {
    const vectors = sentences.map(embedText)
    return vectors.slice(0, -1).map((v, i) => cosineSim(v, vectors[i + 1]))
  }, [sentences])

  const weakest = sims.length ? Math.min(...sims) : 0
  const strongest = sims.length ? Math.max(...sims) : 0

  // Bracket the slider around the range this document actually produces.
  const min = Math.max(0, Math.floor(weakest * 100) / 100)
  const max = Math.min(1, Math.ceil(strongest * 100) / 100)
  const step = Math.max(0.005, Math.round(((max - min) / 20) * 1000) / 1000)
  const threshold = override ?? Math.round(((min + max) / 2) * 1000) / 1000

  const splits = useMemo(
    () => sims.map((s, i) => (s < threshold ? i : -1)).filter(i => i >= 0),
    [sims, threshold],
  )

  const groups = useMemo(() => {
    if (!sentences.length) return []
    const out = []
    let current = [0]
    for (let i = 1; i < sentences.length; i++) {
      if (splits.includes(i - 1)) {
        out.push(current)
        current = [i]
      } else {
        current.push(i)
      }
    }
    out.push(current)
    return out
  }, [sentences, splits])

  return (
    <div>
      <SectionHeader
        title="Semantic chunking"
        description="Every sentence is embedded, then cosine similarity is measured between each adjacent pair. Where similarity drops below the threshold, the topic has shifted and a new chunk begins. Unlike fixed-size splitting, boundaries follow meaning — raise the threshold and the splitter gets progressively pickier."
      />

      <DocumentInput hint="Similarities below are computed from this text, not replayed from a fixture." />

      <SliderRow
        label="Split threshold"
        min={min} max={max} step={step}
        value={threshold}
        onChange={setOverride}
        displayValue={threshold.toFixed(3)}
        hint={`→ ${groups.length} chunk${groups.length === 1 ? '' : 's'} · range ${min.toFixed(2)}–${max.toFixed(2)}`}
      />

      {sims.length === 0 ? (
        <EmptyState>Add at least two sentences above to see boundary detection.</EmptyState>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Label>Cosine similarity between adjacent sentences</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sims.map((s, i) => {
                const isSplit = s < threshold
                return (
                  <div key={i} title={`S${i + 1} → S${i + 2}: ${s.toFixed(3)}`} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 99,
                    background: isSplit ? 'rgba(249,112,102,0.15)' : 'rgba(45,212,160,0.1)',
                    color: isSplit ? '#f97066' : '#2dd4a0',
                    fontFamily: 'var(--mono)',
                    border: `1px solid ${isSplit ? 'rgba(249,112,102,0.3)' : 'rgba(45,212,160,0.2)'}`,
                  }}>
                    S{i + 1}↔S{i + 2}: {s.toFixed(2)}{isSplit ? ' ✂' : ''}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
              Weakest link <strong style={{ color: 'var(--coral)' }}>{weakest.toFixed(3)}</strong>
              {' · '}strongest <strong style={{ color: 'var(--teal)' }}>{strongest.toFixed(3)}</strong>.
              Below {weakest.toFixed(3)} the document stays whole; above {strongest.toFixed(3)}{' '}
              every sentence becomes its own chunk. What matters is where a boundary sits
              relative to its neighbours, not the absolute number — which is why the slider
              rescales to each document.
            </p>
          </Card>

          {groups.map((indices, idx) => {
            const col = CHUNK_COLORS[idx % CHUNK_COLORS.length]
            const terms = topTerms(indices, sentences)
            return (
              <ChunkCard key={idx} borderColor={col.border}>
                <div style={{ marginBottom: 6 }}>
                  <Badge color={col.badge.text} bg={col.badge.bg}>Chunk {idx + 1}</Badge>
                  {terms.length > 0 && (
                    <Badge color="var(--text2)" bg="rgba(255,255,255,0.05)">{terms.join(' · ')}</Badge>
                  )}
                  <Badge color="var(--text3)" bg="rgba(255,255,255,0.04)">
                    S{indices[0] + 1}–S{indices[indices.length - 1] + 1}
                  </Badge>
                </div>
                <span style={{ color: 'var(--text2)' }}>
                  {indices.map(i => sentences[i]).join(' ')}
                </span>
              </ChunkCard>
            )
          })}
        </>
      )}
    </div>
  )
}
