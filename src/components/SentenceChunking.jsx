import { useMemo, useState } from 'react'
import { CHUNK_COLORS } from '../data/palette'
import { useCorpus } from '../state/CorpusContext'
import { ChunkCard, Badge, SliderRow, SectionHeader, Card, Label } from './UI'
import { DocumentInput, EmptyState } from './Inputs'

export default function SentenceChunking() {
  const { sentences } = useCorpus()
  const [perChunk, setPerChunk] = useState(2)
  const [overlap, setOverlap] = useState(0)

  // One sentence of overlap needs a chunk of at least two to mean anything.
  const maxOverlap = Math.max(0, perChunk - 1)
  const effectiveOverlap = Math.min(overlap, maxOverlap)
  const stride = perChunk - effectiveOverlap

  const chunks = useMemo(() => {
    const out = []
    for (let i = 0; i < sentences.length; i += stride) {
      out.push({ start: i, items: sentences.slice(i, i + perChunk) })
      if (i + perChunk >= sentences.length) break
    }
    return out
  }, [sentences, perChunk, stride])

  const tokenCounts = chunks.map(c => c.items.join(' ').split(/\s+/).filter(Boolean).length)
  const minTokens = tokenCounts.length ? Math.min(...tokenCounts) : 0
  const maxTokens = tokenCounts.length ? Math.max(...tokenCounts) : 0

  return (
    <div>
      <SectionHeader
        title="Sentence-boundary chunking"
        description="Split on sentence-ending punctuation, then group N complete sentences per chunk. No chunk ever cuts mid-thought — but because sentences vary in length, chunk sizes do too, which is the trade-off against fixed-size windows."
      />

      <DocumentInput hint="Sentences are detected with a punctuation regex — the same naive splitter most RAG pipelines start with." />

      <SliderRow label="Sentences per chunk" min={1} max={6} value={perChunk} onChange={setPerChunk} />
      <SliderRow
        label="Sentence overlap"
        min={0} max={maxOverlap} value={effectiveOverlap}
        onChange={setOverlap}
        hint={maxOverlap === 0 ? 'needs 2+ sentences per chunk' : undefined}
      />

      <Card style={{ marginBottom: 16 }}>
        <Label>Chunk size variance</Label>
        <div className="stat-row">
          <Stat label="Chunks" value={chunks.length} color="var(--accent2)" />
          <Stat label="Sentences" value={sentences.length} color="var(--text)" />
          <Stat label="Shortest chunk" value={`${minTokens}t`} color="var(--teal)" />
          <Stat label="Longest chunk" value={`${maxTokens}t`} color="var(--amber)" />
          <Stat
            label="Spread"
            value={minTokens ? `${(maxTokens / minTokens).toFixed(1)}×` : '—'}
            color={maxTokens > minTokens * 2 ? 'var(--coral)' : 'var(--teal)'}
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
          A wide spread means some chunks carry far more context than others, which
          skews similarity scores at retrieval time — longer chunks dilute their
          embedding, shorter ones can be too sparse to match anything.
        </p>
      </Card>

      {chunks.length === 0 ? (
        <EmptyState>Add some text above to see it split on sentence boundaries.</EmptyState>
      ) : (
        chunks.map((chunk, idx) => {
          const col = CHUNK_COLORS[idx % CHUNK_COLORS.length]
          const tokens = tokenCounts[idx]
          return (
            <ChunkCard key={idx} borderColor={col.border}>
              <div style={{ marginBottom: 6 }}>
                <Badge color={col.badge.text} bg={col.badge.bg}>Chunk {idx + 1}</Badge>
                <Badge color="var(--text3)" bg="var(--tint)">
                  {chunk.items.length} sentence{chunk.items.length === 1 ? '' : 's'}
                </Badge>
                <Badge color="var(--text3)" bg="var(--tint)">{tokens} tokens</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {chunk.items.map((s, si) => {
                  const globalIndex = chunk.start + si
                  const repeated = idx > 0 && globalIndex < chunks[idx - 1].start + perChunk
                  return (
                    <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: 10, color: repeated ? 'var(--amber)' : col.badge.text,
                        marginTop: 3, flexShrink: 0, fontFamily: 'var(--mono)',
                      }}>
                        S{globalIndex + 1}
                      </span>
                      <span style={{ color: repeated ? 'var(--amber)' : 'var(--text2)' }}>{s}</span>
                    </div>
                  )
                })}
              </div>
            </ChunkCard>
          )
        })
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 15, color, fontWeight: 500 }}>{value}</div>
    </div>
  )
}
