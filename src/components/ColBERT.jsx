import { useMemo, useState } from 'react'
import { useCorpus } from '../state/CorpusContext'
import { Card, Label, Badge, SectionHeader, RankBadge } from './UI'
import { QueryPanel, EmptyState } from './Inputs'
import { maxSim } from '../lib/retrieval'

function simColor(s) {
  if (s >= 0.7) return 'var(--c2)'
  if (s >= 0.4) return 'var(--c1)'
  if (s >= 0.15) return 'var(--c4)'
  return 'var(--text3)'
}

export default function ColBERT() {
  const { query, activeDocs } = useCorpus()
  const [activeToken, setActiveToken] = useState(null)

  const results = useMemo(() => activeDocs
    .map(d => ({ ...d, ...maxSim(query, d.text) }))
    .sort((a, b) => b.total - a.total),
  [activeDocs, query])

  const queryTokens = results[0]?.perToken.map(p => p.queryToken) ?? []
  const selected = activeToken !== null && activeToken < queryTokens.length ? activeToken : null

  return (
    <div>
      <SectionHeader
        title="ColBERT — late interaction"
        description="Instead of collapsing each text to one vector, ColBERT keeps a vector per token. Scoring compares every query token against every document token and keeps the best match for each — MaxSim. It captures token-level interaction like a cross-encoder, but because document token vectors are still pre-computed, it stays far cheaper."
      />

      <QueryPanel />

      <Card style={{ marginBottom: 16 }}>
        <Label>MaxSim</Label>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent2)', marginBottom: 6 }}>
          score(Q, D) = Σ<sub>i</sub> max<sub>j</sub> cos(q<sub>i</sub>, d<sub>j</sub>)
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          For each query token q<sub>i</sub>, find the document token d<sub>j</sub> it matches
          best, then sum those maxima. Stopwords are dropped from the query first, since they
          match everything and carry no signal.
        </div>
      </Card>

      {queryTokens.length === 0 || results.length === 0 ? (
        <EmptyState>
          {results.length === 0
            ? 'Add at least one document with text to score.'
            : 'Enter a query with at least one content word.'}
        </EmptyState>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Label>Query tokens — select one to trace it through every document</Label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {queryTokens.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveToken(selected === i ? null : i)}
                  aria-pressed={selected === i}
                  className="token-btn"
                  style={{
                    background: selected === i ? 'var(--c1-bg2)' : 'var(--c1-bg)',
                    color: selected === i ? 'var(--c1-t)' : 'var(--c1)',
                    borderColor: selected === i ? 'var(--c1)' : 'var(--c1-bg2)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>

          {results.map((doc, di) => (
            <Card key={doc.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <RankBadge rank={di + 1} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Badge color="var(--text3)" bg="var(--tint)">{doc.id}</Badge>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{doc.text}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: simColor(doc.mean) }}>
                    {doc.total.toFixed(3)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    Σ MaxSim · mean {doc.mean.toFixed(2)}
                  </div>
                </div>
              </div>

              {selected === null ? (
                <>
                  <Label>Per query-token MaxSim</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {doc.perToken.map((p, qi) => (
                      <div key={qi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--c1)', minWidth: 70, wordBreak: 'break-all' }}>
                          {p.queryToken}
                        </span>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.round(p.sim * 100)}%`,
                              height: '100%', background: simColor(p.sim), borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', minWidth: 34, textAlign: 'right' }}>
                          {p.sim.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 92, fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>
                          → “{p.matchedToken}”
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Label>
                    Similarity of “{queryTokens[selected]}” to every token in {doc.id}
                  </Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {doc.docTokens.map((tok, ti) => {
                      const sim = doc.perToken[selected]?.sims[ti] ?? 0
                      const isBest = doc.perToken[selected]?.matchedIndex === ti
                      return (
                        <span
                          key={ti}
                          title={`cos = ${sim.toFixed(3)}`}
                          style={{
                            fontFamily: 'var(--mono)', fontSize: 11,
                            padding: '3px 7px', borderRadius: 5,
                            background: `color-mix(in srgb, var(--c2) ${(sim * 55).toFixed(1)}%, transparent)`,
                            border: `1px solid ${isBest ? 'var(--c2)' : 'transparent'}`,
                            color: sim > 0.35 ? 'var(--text)' : 'var(--text3)',
                          }}
                        >
                          {tok}
                          <span style={{ opacity: 0.6, marginLeft: 4 }}>{sim.toFixed(2)}</span>
                        </span>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
                    Best match:{' '}
                    <strong style={{ color: 'var(--c2)' }}>
                      “{doc.perToken[selected].matchedToken}”
                    </strong>{' '}
                    at {doc.perToken[selected].sim.toFixed(3)} — only this value enters the sum.
                  </div>
                </>
              )}
            </Card>
          ))}

          <Card>
            <Label>Why late interaction helps</Label>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              A single-vector bi-encoder averages a document into one point, so a long
              document that answers the query in one clause gets diluted by everything
              around it. MaxSim never averages the document — each query token independently
              finds its best evidence, wherever in the text it happens to sit. Select a query
              token above to see exactly which token it locks onto.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
