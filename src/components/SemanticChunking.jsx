import React, { useState } from 'react'
import { SENTENCES, TOPIC_GROUPS, CHUNK_COLORS } from '../data/ragData'
import { ChunkCard, Badge, Card, Label, SectionHeader } from './UI'

const SIM_SCORES = [0.91, 0.88, 0.72, 0.93, 0.86, 0.41, 0.78, 0.62, 0.83]
const SPLIT_BY_THRESH = {
  1: [],
  2: [5],
  3: [2, 5, 6],
  4: [2, 5, 6, 7],
  5: [0, 1, 2, 3, 4, 5, 6, 7, 8],
}
const THRESH_LABELS = ['', 'very low', 'low', 'medium', 'high', 'very high']

function buildGroups(splits) {
  const groups = []
  let cur = [0]
  for (let i = 1; i < SENTENCES.length; i++) {
    if (splits.includes(i - 1)) {
      groups.push(cur)
      cur = [i]
    } else {
      cur.push(i)
    }
  }
  groups.push(cur)
  return groups
}

export default function SemanticChunking() {
  const [thresh, setThresh] = useState(3)

  const splits = SPLIT_BY_THRESH[thresh]
  const groups = buildGroups(splits)

  const topicLabel = (indices) => {
    const tg = TOPIC_GROUPS.find(t => JSON.stringify(t.indices) === JSON.stringify(indices))
    return tg ? tg.label : null
  }

  return (
    <div>
      <SectionHeader
        title="Semantic chunking"
        description="Each sentence is embedded into a dense vector. Cosine similarity is computed between adjacent sentence pairs. When similarity drops below a threshold — indicating a topic shift — a new chunk begins."
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 100 }}>Split sensitivity</span>
        <input
          type="range" min={1} max={5} value={thresh} step={1}
          onChange={e => setThresh(+e.target.value)}
          style={{ flex: 1, minWidth: 100, maxWidth: 200 }}
        />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent2)', minWidth: 60 }}>
          {THRESH_LABELS[thresh]}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          → {groups.length} chunk{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Label>Cosine similarity between adjacent sentences</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SIM_SCORES.map((s, i) => {
            const isSplit = splits.includes(i)
            return (
              <div key={i} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 99,
                background: isSplit ? 'rgba(249,112,102,0.15)' : 'rgba(45,212,160,0.1)',
                color: isSplit ? '#f97066' : '#2dd4a0',
                fontFamily: 'var(--mono)',
                border: `1px solid ${isSplit ? 'rgba(249,112,102,0.3)' : 'rgba(45,212,160,0.2)'}`,
              }}>
                S{i + 1}↔S{i + 2}: {s.toFixed(2)} {isSplit ? '✂ SPLIT' : ''}
              </div>
            )
          })}
        </div>
      </Card>

      {groups.map((indices, idx) => {
        const col = CHUNK_COLORS[idx % CHUNK_COLORS.length]
        const label = topicLabel(indices)
        return (
          <ChunkCard key={idx} borderColor={col.border}>
            <div style={{ marginBottom: 6 }}>
              <Badge color={col.badge.text} bg={col.badge.bg}>Chunk {idx + 1}</Badge>
              {label && <Badge color="var(--text2)" bg="rgba(255,255,255,0.05)">{label}</Badge>}
              <Badge color="var(--text3)" bg="rgba(255,255,255,0.04)">{indices.length} sent.</Badge>
            </div>
            <span style={{ color: 'var(--text2)' }}>
              {indices.map(i => SENTENCES[i]).join(' ')}
            </span>
          </ChunkCard>
        )
      })}
    </div>
  )
}
