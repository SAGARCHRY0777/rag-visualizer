import React from 'react'
import { HYBRID_DOCS, rrf } from '../data/ragData'
import { Card, Label, Badge, RankBadge, SectionHeader } from './UI'

const scored = HYBRID_DOCS
  .map(d => ({ ...d, rrfScore: rrf(d.bm25Rank) + rrf(d.denseRank) }))
  .sort((a, b) => b.rrfScore - a.rrfScore)

const maxScore = scored[0].rrfScore

export default function HybridRetrieval() {
  return (
    <div>
      <SectionHeader
        title="Hybrid retrieval: BM25 + dense (RRF fusion)"
        description="BM25 (sparse, keyword-matching) and dense bi-encoder retrieval run in parallel. Reciprocal Rank Fusion (RRF) merges both ranked lists without needing score normalisation. The formula rewards consistent high ranks across both methods."
      />

      <Card style={{ marginBottom: 20 }}>
        <Label>RRF formula</Label>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent2)', marginBottom: 6 }}>
          score(d) = 1/(k + rank_bm25) + 1/(k + rank_dense) &nbsp;·&nbsp; k = 60
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          k=60 dampens the effect of rank differences among top results. No score normalisation needed — ranks are universal.
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Label>When each method wins</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            {
              title: 'BM25 wins when…', color: '#f5a623',
              points: ['Exact keywords matter', 'Named entities, product codes', 'Short, precise queries', 'Domain-specific jargon'],
            },
            {
              title: 'Dense wins when…', color: '#7c6af7',
              points: ['Semantic paraphrase', '"Viral" matches "virus"', 'Long, conversational queries', 'Cross-lingual retrieval'],
            },
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

      <Label>Results — sorted by RRF fused score</Label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto',
        gap: '6px 10px',
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--text3)',
        padding: '4px 12px',
        marginBottom: 4,
      }}>
        <span></span>
        <span>Document</span>
        <span style={{ color: '#f5a623' }}>BM25</span>
        <span style={{ color: '#7c6af7' }}>Dense</span>
        <span style={{ color: '#2dd4a0' }}>RRF</span>
      </div>

      {scored.map((d, i) => {
        const barW = Math.round((d.rrfScore / maxScore) * 100)
        return (
          <div key={d.id} style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto auto auto',
            gap: '6px 10px',
            alignItems: 'center',
            padding: '10px 12px',
            borderRadius: 8,
            background: i % 2 === 0 ? 'var(--bg3)' : 'transparent',
            marginBottom: 4,
          }}>
            <RankBadge rank={i + 1} />
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{d.text}</div>
              <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', maxWidth: 300 }}>
                <div style={{ width: `${barW}%`, height: '100%', background: '#2dd4a0', borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#f5a623' }}>#{d.bm25Rank}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#7c6af7' }}>#{d.denseRank}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#2dd4a0' }}>{d.rrfScore.toFixed(4)}</span>
          </div>
        )
      })}

      <Card style={{ marginTop: 16 }}>
        <Label>Why D3 wins</Label>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          D3 ranks #1 in dense but only #3 in BM25. D2 ranks #1 in BM25 but #2 in dense. RRF gives D3 the win because dense rank #1 contributes 1/61 = 0.01639, while BM25 rank #3 contributes 1/63 = 0.01587. Combined: D3 scores 0.03226 vs D2's 0.03252. They are very close — but D5 (stocks/finance) consistently ranks #4-5 in both and lands last.
        </p>
      </Card>
    </div>
  )
}
