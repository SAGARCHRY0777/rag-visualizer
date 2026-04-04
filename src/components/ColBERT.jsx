import React, { useState } from 'react'
import { COLBERT_DATA } from '../data/ragData'
import { Card, Label, Badge, SectionHeader } from './UI'

function scoreColor(s) {
  if (s >= 0.7) return '#2dd4a0'
  if (s >= 0.4) return '#7c6af7'
  return '#5a5a72'
}

export default function ColBERT() {
  const [activeQuery, setActiveQuery] = useState(null)
  const { queryTokens, docs } = COLBERT_DATA

  return (
    <div>
      <SectionHeader
        title="ColBERT / late interaction"
        description="Each query token and each document token gets its own embedding. Score = sum of MaxSim: for each query token, find the most similar document token, then sum across all query tokens. More precise than single-vector bi-encoder, cheaper than full cross-encoder."
      />

      <Card style={{ marginBottom: 20 }}>
        <Label>MaxSim formula</Label>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent2)', marginBottom: 6 }}>
          score(Q, D) = Σ<sub>i</sub> max<sub>j</sub> cos(q<sub>i</sub>, d<sub>j</sub>)
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          For each query token q<sub>i</sub>, find the document token d<sub>j</sub> with highest cosine similarity. Sum all query token maximums for the final score.
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Label>Query tokens — click to highlight</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {queryTokens.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveQuery(activeQuery === i ? null : i)}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 13,
                fontFamily: 'var(--mono)', cursor: 'pointer',
                background: activeQuery === i ? 'rgba(124,106,247,0.3)' : 'rgba(124,106,247,0.1)',
                color: activeQuery === i ? '#a78bfa' : '#7c6af7',
                border: `1px solid ${activeQuery === i ? '#7c6af7' : 'rgba(124,106,247,0.2)'}`,
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {docs.map((doc) => {
        const finalScore = (doc.maxsims.slice(0, queryTokens.length).reduce((s, v) => s + v, 0) / queryTokens.length).toFixed(3)
        return (
          <Card key={doc.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">{doc.id}</Badge>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{doc.text}</span>
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 12,
                color: +finalScore >= 0.5 ? '#2dd4a0' : '#9090a8',
                marginLeft: 12, flexShrink: 0,
              }}>
                avg MaxSim: {finalScore}
              </div>
            </div>

            <Label>Per query-token MaxSim</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {queryTokens.map((qt, qi) => {
                const sim = doc.maxsims[qi] ?? 0.05
                const pct = Math.round(sim * 100)
                const bestTokIdx = doc.maxsims.reduce((best, v, i) => v > doc.maxsims[best] ? i : best, 0)
                const bestTok = doc.tokens[bestTokIdx] || '—'
                const isActive = activeQuery === qi
                return (
                  <div key={qi} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 8px', borderRadius: 6,
                    background: isActive ? 'rgba(124,106,247,0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(124,106,247,0.3)' : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#7c6af7', minWidth: 56 }}>
                      {qt}
                    </span>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: scoreColor(sim), borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', minWidth: 36 }}>
                      {sim.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 80, fontFamily: 'var(--mono)' }}>
                      → "{doc.tokens.find((_, ti) => doc.maxsims[ti] === sim) || bestTok}"
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
