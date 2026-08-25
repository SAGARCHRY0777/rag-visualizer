import { useMemo, useState } from 'react'
import { useCorpus } from '../state/CorpusContext'
import { Card, Label, SectionHeader, CompareGrid, RankBadge, SliderRow } from './UI'
import { QueryPanel, EmptyState } from './Inputs'
import { bm25, cosineSim, embedText, fuseRRF, rankBy, rrf } from '../lib/retrieval'

export default function HybridRetrieval() {
  const { query, activeDocs } = useCorpus()
  const [k, setK] = useState(60)

  const analysis = useMemo(() => {
    if (!activeDocs.length) return null

    const queryVec = embedText(query)
    const sparse = rankBy(bm25(query, activeDocs), d => d.score)
    const dense = rankBy(
      activeDocs.map(d => ({ ...d, score: cosineSim(queryVec, embedText(d.text)) })),
      d => d.score,
    )

    const sparseRanks = Object.fromEntries(sparse.map(d => [d.id, d.rank]))
    const denseRanks = Object.fromEntries(dense.map(d => [d.id, d.rank]))
    const byId = Object.fromEntries(activeDocs.map(d => [d.id, d]))

    const fused = fuseRRF(
      activeDocs.map(d => d.id),
      [
        { label: 'BM25', ranks: sparseRanks },
        { label: 'Dense', ranks: denseRanks },
      ],
      k,
    )
      .map(f => ({
        ...f,
        text: byId[f.id].text,
        bm25Rank: sparseRanks[f.id],
        denseRank: denseRanks[f.id],
        bm25Score: sparse.find(d => d.id === f.id)?.score ?? 0,
        denseScore: dense.find(d => d.id === f.id)?.score ?? 0,
        terms: sparse.find(d => d.id === f.id)?.terms ?? [],
      }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

    return { sparse, dense, fused, winner: fused[0], runnerUp: fused[1] }
  }, [activeDocs, query, k])

  return (
    <div>
      <SectionHeader
        title="Hybrid retrieval — BM25 + dense, fused with RRF"
        description="BM25 matches literal terms; a dense retriever matches meaning. Each fails where the other succeeds, so production systems run both and merge the results. Reciprocal Rank Fusion combines the two ranked lists using positions alone, which sidesteps the fact that a BM25 score and a cosine similarity are not on comparable scales."
      />

      <QueryPanel />

      <Card style={{ marginBottom: 16 }}>
        <Label>RRF</Label>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent2)', marginBottom: 6, overflowX: 'auto' }}>
          score(d) = 1/(k + rank<sub>bm25</sub>) + 1/(k + rank<sub>dense</sub>)
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          A large k flattens the difference between neighbouring ranks, so a document must
          place well in <em>both</em> lists to win. A small k makes the top position in either
          list dominate.
        </div>
      </Card>

      <SliderRow
        label="RRF constant k"
        min={1} max={100} value={k}
        onChange={setK}
        hint={k >= 40 ? 'consensus favoured' : 'top ranks dominate'}
      />

      <Card style={{ marginBottom: 16 }}>
        <Label>When each method wins</Label>
        <CompareGrid columns={[
          {
            title: 'BM25 wins when…',
            color: 'var(--c4)',
            points: [
              'Exact keywords matter',
              'Names, codes, identifiers',
              'Rare domain jargon',
              'The term simply must appear',
            ],
          },
          {
            title: 'Dense wins when…',
            color: 'var(--c1)',
            points: [
              'The query paraphrases the document',
              'Vocabulary differs entirely',
              'Long conversational questions',
              'Morphological variants of a term',
            ],
          },
        ]} />
      </Card>

      {!analysis ? (
        <EmptyState>Add at least one document with text to fuse.</EmptyState>
      ) : (
        <>
          <Label>Fused ranking</Label>
          <div className="hybrid-scroll">
            <div className="hybrid-table">
              <div className="hybrid-head">
                <span />
                <span>Document</span>
                <span style={{ color: 'var(--c4)' }}>BM25</span>
                <span style={{ color: 'var(--c1)' }}>Dense</span>
                <span style={{ color: 'var(--c2)' }}>RRF</span>
              </div>

              {analysis.fused.map((d, i) => (
                <div key={d.id} className="hybrid-row" style={{ background: i % 2 === 0 ? 'var(--bg3)' : 'transparent' }}>
                  <RankBadge rank={i + 1} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginRight: 6 }}>
                        {d.id}
                      </span>
                      {d.text}
                    </div>
                    <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', maxWidth: 300 }}>
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.round((d.score / analysis.winner.score) * 100)}%`,
                          height: '100%', background: 'var(--c2)', borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                  <span className="hybrid-cell" style={{ color: 'var(--c4)' }}>
                    #{d.bm25Rank}
                    <em>{d.bm25Score.toFixed(2)}</em>
                  </span>
                  <span className="hybrid-cell" style={{ color: 'var(--c1)' }}>
                    #{d.denseRank}
                    <em>{d.denseScore.toFixed(2)}</em>
                  </span>
                  <span className="hybrid-cell" style={{ color: 'var(--c2)' }}>
                    {d.score.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card style={{ marginTop: 16 }}>
            <Label>Why {analysis.winner.id} wins</Label>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              {analysis.winner.id} placed <strong style={{ color: 'var(--c4)' }}>#{analysis.winner.bm25Rank}</strong> in
              BM25 and <strong style={{ color: 'var(--c1)' }}>#{analysis.winner.denseRank}</strong> in dense retrieval,
              contributing 1/({k}+{analysis.winner.bm25Rank}) = {rrf(analysis.winner.bm25Rank, k).toFixed(5)} and
              1/({k}+{analysis.winner.denseRank}) = {rrf(analysis.winner.denseRank, k).toFixed(5)} for a fused{' '}
              <strong style={{ color: 'var(--c2)' }}>{analysis.winner.score.toFixed(5)}</strong>.
              {analysis.runnerUp && (
                <>
                  {' '}Runner-up {analysis.runnerUp.id} scored {analysis.runnerUp.score.toFixed(5)} from
                  ranks #{analysis.runnerUp.bm25Rank} and #{analysis.runnerUp.denseRank} — a margin of{' '}
                  {(analysis.winner.score - analysis.runnerUp.score).toFixed(5)}.
                  {analysis.winner.bm25Rank !== analysis.winner.denseRank && (
                    <> Note that {analysis.winner.id} did not top either individual list; consistency
                    across both is what RRF rewards.</>
                  )}
                </>
              )}
            </p>
          </Card>

          <Card>
            <Label>BM25 term contributions</Label>
            {analysis.sparse.every(d => d.terms.every(t => t.tf === 0)) ? (
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0, lineHeight: 1.6 }}>
                No query term appears literally in any document, so BM25 scores everything zero
                and the fused ranking is carried entirely by the dense retriever. This is the
                lexical-gap problem hybrid search exists to solve.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analysis.sparse
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3)
                  .map(d => (
                    <div key={d.id}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text3)', marginRight: 6 }}>{d.id}</span>
                        {d.score.toFixed(3)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {d.terms.filter(t => t.tf > 0).map(t => (
                          <span key={t.term} style={{
                            fontFamily: 'var(--mono)', fontSize: 11,
                            padding: '2px 7px', borderRadius: 5,
                            background: 'var(--c4-bg)', color: 'var(--c4)',
                          }}>
                            {t.term} ×{t.tf} → {t.contribution.toFixed(2)}
                          </span>
                        ))}
                        {d.terms.every(t => t.tf === 0) && (
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>no query terms present</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
