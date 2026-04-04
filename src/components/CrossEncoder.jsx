import React from 'react'
import { CROSS_CHUNKS } from '../data/ragData'
import { Card, Label, RankBadge, ScoreBar, Badge, SectionHeader } from './UI'

const QUERY = "How does the immune system fight viruses?"

const sorted = [...CROSS_CHUNKS].sort((a, b) => b.score - a.score)

function scoreColor(s) {
  if (s >= 0.85) return '#2dd4a0'
  if (s >= 0.65) return '#7c6af7'
  if (s >= 0.5) return '#f5a623'
  return '#9090a8'
}

export default function CrossEncoder() {
  return (
    <div>
      <SectionHeader
        title="Cross-encoder reranking"
        description="The query and each candidate chunk are concatenated into a single input and passed through a transformer together. Full cross-attention between query tokens and document tokens produces a precise relevance score. Slow per-pair, but highly accurate."
      />

      <Card style={{ marginBottom: 20 }}>
        <Label>Model input format</Label>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 12,
          background: 'var(--bg4)', borderRadius: 6,
          padding: '10px 12px', color: 'var(--text2)',
        }}>
          <span style={{ color: '#f97066' }}>[CLS]</span>{' '}
          <span style={{ color: 'var(--accent2)' }}>{QUERY}</span>{' '}
          <span style={{ color: '#f97066' }}>[SEP]</span>{' '}
          <span style={{ color: 'var(--teal)' }}>{'<chunk text>'}</span>{' '}
          <span style={{ color: '#f97066' }}>[SEP]</span>
          <div style={{ marginTop: 6, color: 'var(--text3)', fontSize: 11 }}>
            → single transformer pass → sigmoid → score ∈ [0, 1]
          </div>
        </div>
      </Card>

      <div style={{ marginBottom: 10 }}>
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 14,
        }}>
          <Label>Query</Label>
          <span style={{ fontSize: 14, color: 'var(--accent2)', fontWeight: 500 }}>{QUERY}</span>
        </div>

        <Label>Candidates — scored and reranked</Label>
        {sorted.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: i % 2 === 0 ? 'var(--bg3)' : 'transparent',
            marginBottom: 4,
          }}>
            <RankBadge rank={i + 1} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">{c.id}</Badge>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6, lineHeight: 1.5 }}>
                {c.text}
              </div>
              <ScoreBar score={c.score} color={scoreColor(c.score)} />
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: 16 }}>
        <Label>Why C3 ranks #1</Label>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          C3 says "viral infections" not "virus" — yet it scores 0.93. The cross-encoder sees the query and chunk together in the same attention layers, so it understands that <em style={{ color: 'var(--text)' }}>viral</em> entails the concept of <em style={{ color: 'var(--text)' }}>virus</em>. A bi-encoder would miss this because it encodes them separately.
        </p>
      </Card>
    </div>
  )
}
