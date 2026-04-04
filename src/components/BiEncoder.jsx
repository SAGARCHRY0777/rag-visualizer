import React from 'react'
import { BI_DOCS, QUERY_VEC, cosine } from '../data/ragData'
import { Card, Label, RankBadge, ScoreBar, Badge, SectionHeader } from './UI'

const scored = [...BI_DOCS]
  .map(d => ({ ...d, score: cosine(QUERY_VEC, d.vec) }))
  .sort((a, b) => b.score - a.score)

const maxScore = Math.max(...scored.map(d => d.score))

function scoreColor(s) {
  if (s >= 0.95) return '#2dd4a0'
  if (s >= 0.85) return '#7c6af7'
  if (s >= 0.7) return '#f5a623'
  return '#5a5a72'
}

export default function BiEncoder() {
  return (
    <div>
      <SectionHeader
        title="Bi-encoder retrieval"
        description="Query and documents are encoded independently into dense vectors. Similarity is cosine distance between vectors. All document embeddings are pre-computed at index time — at query time only the query is re-encoded, then a single dot-product pass finds top-K."
      />

      <Card style={{ marginBottom: 20 }}>
        <Label>Query vector (6-dim, simulated)</Label>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent2)' }}>
          [{QUERY_VEC.map(v => v.toFixed(2)).join(', ')}]
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
          Query: "How does the immune system fight viruses?"
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Label>Architecture comparison</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { title: 'Bi-encoder (this tab)', points: ['Encode query + docs separately', 'Pre-compute doc embeddings', 'Cosine similarity at runtime', 'O(1) query time — very fast', 'Less accurate (no cross-attention)'], color: '#7c6af7' },
            { title: 'Cross-encoder (prev tab)', points: ['Encode (query, doc) jointly', 'Cannot pre-compute', 'Full transformer per pair', 'O(N) query time — slow', 'Most accurate'], color: '#2dd4a0' },
          ].map(col => (
            <div key={col.title} style={{ background: 'var(--bg4)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: col.color, marginBottom: 8 }}>{col.title}</div>
              {col.points.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>· {p}</div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Label>Documents ranked by cosine similarity to query</Label>
      {scored.map((d, i) => (
        <div key={d.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: i % 2 === 0 ? 'var(--bg3)' : 'transparent',
          marginBottom: 4,
        }}>
          <RankBadge rank={i + 1} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">{d.id}</Badge>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 5 }}>{d.text}</div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11,
              color: 'var(--text3)', marginBottom: 5,
            }}>
              vec: [{d.vec.map(v => v.toFixed(1)).join(', ')}]
            </div>
            <ScoreBar score={d.score} max={maxScore} color={scoreColor(d.score)} />
          </div>
        </div>
      ))}
    </div>
  )
}
