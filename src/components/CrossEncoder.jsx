import { useMemo, useState } from 'react'
import { useCorpus } from '../state/CorpusContext'
import { Card, Label, SectionHeader, RankedRow, SliderRow, Badge } from './UI'
import { QueryPanel, EmptyState } from './Inputs'
import { cosineSim, embedText, crossEncoderScore } from '../lib/retrieval'

function scoreColor(s) {
  if (s >= 0.8) return 'var(--c2)'
  if (s >= 0.55) return 'var(--c1)'
  if (s >= 0.3) return 'var(--c4)'
  return 'var(--text2)'
}

/** ▲/▼ movement between the retrieval rank and the rerank rank. */
function Movement({ from, to }) {
  const delta = from - to
  if (delta === 0) {
    return <Badge color="var(--text3)" bg="var(--tint)">— held #{to}</Badge>
  }
  const up = delta > 0
  return (
    <Badge
      color={up ? 'var(--teal)' : 'var(--coral)'}
      bg={up ? 'var(--c2-bg)' : 'var(--c3-bg)'}
    >
      {up ? '▲' : '▼'} {Math.abs(delta)} (#{from} → #{to})
    </Badge>
  )
}

export default function CrossEncoder() {
  const { query, activeDocs } = useCorpus()
  const [topK, setTopK] = useState(4)

  const queryVec = useMemo(() => embedText(query), [query])

  // Stage 1: cheap retrieval over everything, exactly as the bi-encoder tab does.
  const retrieved = useMemo(() => activeDocs
    .map(d => ({ ...d, retrievalScore: cosineSim(queryVec, embedText(d.text)) }))
    .sort((a, b) => b.retrievalScore - a.retrievalScore)
    .map((d, i) => ({ ...d, retrievalRank: i + 1 })),
  [activeDocs, queryVec])

  const effectiveK = Math.min(topK, retrieved.length)
  const shortlist = retrieved.slice(0, effectiveK)

  // Stage 2: the expensive model runs only over the shortlist.
  const reranked = useMemo(() => shortlist
    .map(d => ({ ...d, score: crossEncoderScore(query, d.text) }))
    .sort((a, b) => b.score - a.score)
    .map((d, i) => ({ ...d, finalRank: i + 1 })),
  [shortlist, query])

  const moved = reranked.filter(d => d.retrievalRank !== d.finalRank).length

  return (
    <div>
      <SectionHeader
        title="Cross-encoder reranking"
        description="The query and a candidate are concatenated into one sequence and passed through the model together, so every query token can attend to every document token. That cross-attention is what catches paraphrase — and why it costs a full model pass per candidate, restricting it to a shortlist a cheaper retriever has already narrowed down."
      />

      <QueryPanel />

      <Card style={{ marginBottom: 16 }}>
        <Label>Model input format</Label>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 12,
          background: 'var(--bg4)', borderRadius: 6,
          padding: '10px 12px', color: 'var(--text2)',
          overflowX: 'auto',
        }}>
          <span style={{ color: 'var(--c3)' }}>[CLS]</span>{' '}
          <span style={{ color: 'var(--accent2)' }}>{query || '<your query>'}</span>{' '}
          <span style={{ color: 'var(--c3)' }}>[SEP]</span>{' '}
          <span style={{ color: 'var(--teal)' }}>{'<candidate text>'}</span>{' '}
          <span style={{ color: 'var(--c3)' }}>[SEP]</span>
          <div style={{ marginTop: 6, color: 'var(--text3)', fontSize: 11 }}>
            → one transformer pass → sigmoid → score ∈ [0, 1]
          </div>
        </div>
      </Card>

      <SliderRow
        label="Shortlist size (K)"
        min={1} max={Math.max(1, retrieved.length)} value={effectiveK}
        onChange={setTopK}
        hint={`${effectiveK} model passes · ${retrieved.length - effectiveK} candidate${retrieved.length - effectiveK === 1 ? '' : 's'} never scored`}
      />

      {retrieved.length === 0 ? (
        <EmptyState>Add at least one document with text to rerank.</EmptyState>
      ) : (
        <>
          <Label>Stage 1 — bi-encoder retrieval over all {retrieved.length} documents</Label>
          <div style={{ marginBottom: 18 }}>
            {retrieved.map(d => (
              <div key={d.id} style={{
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '6px 10px', borderRadius: 6, marginBottom: 2,
                opacity: d.retrievalRank <= effectiveK ? 1 : 0.4,
                background: d.retrievalRank <= effectiveK ? 'var(--bg3)' : 'transparent',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', minWidth: 24 }}>
                  #{d.retrievalRank}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', minWidth: 26 }}>
                  {d.id}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, minWidth: 0 }}>{d.text}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                  {d.retrievalScore.toFixed(3)}
                </span>
                {d.retrievalRank > effectiveK && (
                  <span style={{ fontSize: 10, color: 'var(--coral)', flexShrink: 0 }}>cut</span>
                )}
              </div>
            ))}
          </div>

          <Label>Stage 2 — cross-encoder reranks the shortlist</Label>
          {reranked.map(d => (
            <RankedRow
              key={d.id}
              rank={d.finalRank}
              id={d.id}
              text={d.text}
              detail={<Movement from={d.retrievalRank} to={d.finalRank} />}
              score={d.score}
              scoreColor={scoreColor(d.score)}
            />
          ))}

          <Card style={{ marginTop: 16 }}>
            <Label>What the rerank changed</Label>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              {moved === 0 ? (
                <>The cross-encoder agreed with the retriever on all {effectiveK} shortlisted
                documents — which is common when the query shares vocabulary with the best
                match. Try rewording the query as a paraphrase that avoids the documents’
                own words, and the two stages will start to disagree.</>
              ) : (
                <>{moved} of {effectiveK} shortlisted documents changed position. Reranking
                pays off precisely here: the retriever is optimised for recall over the whole
                corpus, while the cross-encoder sees each candidate alongside the query and
                can tell a genuine answer from a merely topical one.</>
              )}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>
              Note: the score here is a heuristic stand-in for a trained reranker — token-level
              soft matching blended with whole-text similarity, squashed through a sigmoid. It
              is directionally faithful, not a real model.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
