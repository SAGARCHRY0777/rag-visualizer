import React, { useState } from 'react'
import { words, RAG_TEXT, CHUNK_COLORS } from '../data/ragData'
import { ChunkCard, Badge, SliderRow, SectionHeader } from './UI'

export default function FixedSize() {
  const [chunkSize, setChunkSize] = useState(40)
  const [overlap, setOverlap] = useState(8)

  const ww = words(RAG_TEXT)
  const chunks = []
  let i = 0
  while (i < ww.length) {
    chunks.push(ww.slice(i, i + chunkSize).join(' '))
    i += Math.max(1, chunkSize - overlap)
  }

  return (
    <div>
      <SectionHeader
        title="Fixed-size chunking"
        description="Split every N tokens with an overlap O between adjacent chunks. Overlap prevents context loss at boundaries — the last O tokens of chunk N also appear at the start of chunk N+1."
      />
      <SliderRow label="Chunk size (tokens)" min={15} max={80} value={chunkSize} onChange={setChunkSize} />
      <SliderRow label="Overlap (tokens)" min={0} max={20} value={overlap} onChange={setOverlap} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
        <span>Total chunks: <strong style={{ color: 'var(--accent2)' }}>{chunks.length}</strong></span>
        <span>·</span>
        <span>Total tokens: <strong style={{ color: 'var(--text)' }}>{ww.length}</strong></span>
        <span>·</span>
        <span>Overlap ratio: <strong style={{ color: 'var(--teal)' }}>{((overlap / chunkSize) * 100).toFixed(0)}%</strong></span>
      </div>

      {chunks.map((c, idx) => {
        const col = CHUNK_COLORS[idx % CHUNK_COLORS.length]
        return (
          <ChunkCard key={idx} borderColor={col.border}>
            <div style={{ marginBottom: 6 }}>
              <Badge color={col.badge.text} bg={col.badge.bg}>Chunk {idx + 1}</Badge>
              <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">{words(c).length} tokens</Badge>
              {idx > 0 && <Badge color="var(--amber)" bg="rgba(245,166,35,0.1)">↺ {overlap}t overlap</Badge>}
            </div>
            <span style={{ color: 'var(--text2)' }}>{c}</span>
          </ChunkCard>
        )
      })}
    </div>
  )
}
