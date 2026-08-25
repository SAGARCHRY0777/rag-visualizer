import { useMemo, useState } from 'react'
import { CHUNK_COLORS } from '../data/palette'
import { useCorpus } from '../state/CorpusContext'
import { ChunkCard, Badge, SliderRow, SectionHeader, Card, Label } from './UI'
import { DocumentInput, EmptyState } from './Inputs'

const MAX_CHUNK = 120

function chunkFixed(tokens, size, stride) {
  const chunks = []
  for (let i = 0; i < tokens.length; i += stride) {
    chunks.push({ start: i, tokens: tokens.slice(i, i + size) })
    // The final window already reaches the end; stepping again would emit a
    // chunk that is a strict suffix of this one.
    if (i + size >= tokens.length) break
  }
  return chunks
}

export default function FixedSize() {
  const { document } = useCorpus()
  const [chunkSize, setChunkSize] = useState(40)
  const [overlap, setOverlap] = useState(8)

  const tokens = useMemo(
    () => document.split(/\s+/).filter(Boolean),
    [document],
  )

  // Overlap can never reach the chunk size, or the window would stop advancing.
  const maxOverlap = Math.max(0, Math.min(chunkSize - 1, Math.floor(MAX_CHUNK / 2)))
  const effectiveOverlap = Math.min(overlap, maxOverlap)
  const stride = chunkSize - effectiveOverlap

  const chunks = useMemo(
    () => chunkFixed(tokens, chunkSize, stride),
    [tokens, chunkSize, stride],
  )

  const duplicated = chunks.length > 1 ? effectiveOverlap * (chunks.length - 1) : 0
  const inflation = tokens.length ? (duplicated / tokens.length) * 100 : 0

  return (
    <div>
      <SectionHeader
        title="Fixed-size chunking"
        description="Split every N tokens with an overlap O between adjacent chunks. Overlap prevents context loss at boundaries — the last O tokens of chunk N reappear at the start of chunk N+1 — but every duplicated token is stored and embedded twice."
      />

      <DocumentInput hint="Chunk boundaries below are computed live from this text." />

      <SliderRow
        label="Chunk size (tokens)"
        min={10} max={MAX_CHUNK} value={chunkSize}
        onChange={setChunkSize}
      />
      <SliderRow
        label="Overlap (tokens)"
        min={0} max={maxOverlap} value={effectiveOverlap}
        onChange={setOverlap}
        hint={effectiveOverlap === maxOverlap ? 'capped below chunk size' : undefined}
      />

      <Card style={{ marginBottom: 16 }}>
        <Label>Index cost</Label>
        <div className="stat-row">
          <Stat label="Chunks" value={chunks.length} color="var(--accent2)" />
          <Stat label="Tokens in document" value={tokens.length} color="var(--text)" />
          <Stat label="Stride" value={`${stride}t`} color="var(--text)" />
          <Stat label="Duplicated tokens" value={duplicated} color="var(--amber)" />
          <Stat label="Storage inflation" value={`${inflation.toFixed(0)}%`} color={inflation > 40 ? 'var(--coral)' : 'var(--teal)'} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
          Raising overlap protects context that straddles a boundary, at the cost of
          embedding and storing the same tokens repeatedly. Storage inflation is the
          share of the index that is duplicated text.
        </p>
      </Card>

      {chunks.length === 0 ? (
        <EmptyState>Add some text above to see it chunked.</EmptyState>
      ) : (
        chunks.map((chunk, idx) => {
          const col = CHUNK_COLORS[idx % CHUNK_COLORS.length]
          const overlapCount = idx > 0 ? Math.min(effectiveOverlap, chunk.tokens.length) : 0
          return (
            <ChunkCard key={idx} borderColor={col.border}>
              <div style={{ marginBottom: 6 }}>
                <Badge color={col.badge.text} bg={col.badge.bg}>Chunk {idx + 1}</Badge>
                <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">{chunk.tokens.length} tokens</Badge>
                <Badge color="var(--text3)" bg="rgba(255,255,255,0.04)">
                  t{chunk.start}–{chunk.start + chunk.tokens.length - 1}
                </Badge>
                {overlapCount > 0 && (
                  <Badge color="var(--amber)" bg="rgba(245,166,35,0.1)">↺ {overlapCount}t repeated</Badge>
                )}
              </div>
              <span style={{ color: 'var(--text2)' }}>
                {overlapCount > 0 && (
                  <mark style={{
                    background: 'rgba(245,166,35,0.16)',
                    color: 'var(--amber)',
                    borderRadius: 3,
                    padding: '0 2px',
                  }}>
                    {chunk.tokens.slice(0, overlapCount).join(' ')}
                  </mark>
                )}
                {overlapCount > 0 ? ' ' : ''}
                {chunk.tokens.slice(overlapCount).join(' ')}
              </span>
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
