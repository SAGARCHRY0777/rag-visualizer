import { useMemo } from 'react'
import { useCorpus } from '../state/CorpusContext'
import { Card, Label, SectionHeader, RankedRow, CompareGrid } from './UI'
import { QueryPanel, VectorStrip, EmptyState } from './Inputs'
import { cosineSim, embedText, EMBED_DIMS } from '../lib/retrieval'

function scoreColor(s) {
  if (s >= 0.6) return 'var(--c2)'
  if (s >= 0.35) return 'var(--c1)'
  if (s >= 0.15) return 'var(--c4)'
  return 'var(--text3)'
}

export default function BiEncoder() {
  const { query, activeDocs } = useCorpus()

  const queryVec = useMemo(() => embedText(query), [query])

  const ranked = useMemo(() => activeDocs
    .map(d => {
      const vec = embedText(d.text)
      return { ...d, vec, score: cosineSim(queryVec, vec) }
    })
    .sort((a, b) => b.score - a.score),
  [activeDocs, queryVec])

  const maxScore = ranked.length ? Math.max(...ranked.map(d => d.score), 0.0001) : 1

  return (
    <div>
      <SectionHeader
        title="Bi-encoder retrieval"
        description="Query and documents are encoded independently into dense vectors, then compared with cosine similarity. Because document vectors are computed once at index time, the only work at query time is encoding the query and one similarity sweep — which is what makes this fast enough to run over millions of documents."
      />

      <QueryPanel />

      <Card style={{ marginBottom: 16 }}>
        <Label>Query embedding — {EMBED_DIMS} dimensions</Label>
        <VectorStrip vec={queryVec} color="var(--c1-t)" height={30} />
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, lineHeight: 1.6 }}>
          Each bar is a slice of the vector. Documents whose fingerprint lines up with
          this one score highly. The embedding is a hashed character-trigram bag, so
          related word forms — “viral” and “virus” — share features the way a trained
          encoder would.
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Label>Bi-encoder vs cross-encoder</Label>
        <CompareGrid columns={[
          {
            title: 'Bi-encoder (this tab)',
            color: 'var(--c1)',
            points: [
              'Encodes query and docs separately',
              'Doc vectors pre-computed at index time',
              'One cosine sweep at query time',
              'Scales to millions of docs',
              'Misses interactions between the two texts',
            ],
          },
          {
            title: 'Cross-encoder',
            color: 'var(--c2)',
            points: [
              'Encodes (query, doc) as one sequence',
              'Nothing can be pre-computed',
              'A full model pass per candidate',
              'Only viable over a shortlist',
              'Sees every query–doc token interaction',
            ],
          },
        ]} />
      </Card>

      <Label>Ranked by cosine similarity</Label>
      {ranked.length === 0 ? (
        <EmptyState>Add at least one document with text to rank.</EmptyState>
      ) : (
        ranked.map((d, i) => (
          <RankedRow
            key={d.id}
            rank={i + 1}
            id={d.id}
            text={d.text}
            detail={<VectorStrip vec={d.vec} color={scoreColor(d.score)} height={14} />}
            score={d.score}
            scoreMax={maxScore}
            scoreColor={scoreColor(d.score)}
          />
        ))
      )}

      <Card style={{ marginTop: 16 }}>
        <Label>What to try</Label>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
          Reword the query so it shares no vocabulary with the best document — a
          bi-encoder still finds it, because the vectors encode overlapping subwords
          rather than exact terms. Then add an off-topic document and watch it settle
          near zero regardless of how long it is.
        </p>
      </Card>
    </div>
  )
}
