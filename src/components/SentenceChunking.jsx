import React, { useState } from 'react'
import { SENTENCES, CHUNK_COLORS } from '../data/ragData'
import { ChunkCard, Badge, SliderRow, SectionHeader } from './UI'

export default function SentenceChunking() {
  const [perChunk, setPerChunk] = useState(2)

  const chunks = []
  for (let i = 0; i < SENTENCES.length; i += perChunk) {
    chunks.push(SENTENCES.slice(i, i + perChunk))
  }

  return (
    <div>
      <SectionHeader
        title="Sentence-boundary chunking"
        description="Split on sentence-ending punctuation (. ! ?). Each chunk contains N complete sentences. No arbitrary token cuts — every chunk is a coherent thought. Sentence detection uses regex on period, exclamation, and question marks."
      />
      <SliderRow label="Sentences per chunk" min={1} max={4} value={perChunk} onChange={setPerChunk} />

      <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
        Total chunks: <strong style={{ color: 'var(--accent2)' }}>{chunks.length}</strong>
        <span style={{ margin: '0 8px' }}>·</span>
        Total sentences: <strong style={{ color: 'var(--text)' }}>{SENTENCES.length}</strong>
      </div>

      {chunks.map((sents, idx) => {
        const col = CHUNK_COLORS[idx % CHUNK_COLORS.length]
        return (
          <ChunkCard key={idx} borderColor={col.border}>
            <div style={{ marginBottom: 6 }}>
              <Badge color={col.badge.text} bg={col.badge.bg}>Chunk {idx + 1}</Badge>
              <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">
                {sents.length} sentence{sents.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sents.map((s, si) => (
                <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, color: col.badge.text, marginTop: 3, flexShrink: 0, fontFamily: 'var(--mono)' }}>
                    S{idx * perChunk + si + 1}
                  </span>
                  <span style={{ color: 'var(--text2)' }}>{s}</span>
                </div>
              ))}
            </div>
          </ChunkCard>
        )
      })}
    </div>
  )
}
