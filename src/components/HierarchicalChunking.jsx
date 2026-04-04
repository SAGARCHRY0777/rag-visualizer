import React, { useState } from 'react'
import { SENTENCES, TOPIC_GROUPS, CHUNK_COLORS } from '../data/ragData'
import { ChunkCard, Badge, Card, Label, SectionHeader } from './UI'

const PARENTS = [
  { label: 'Immune basics', summary: 'The immune system defends against pathogens using specialized cells.', color: CHUNK_COLORS[0] },
  { label: 'Lymphocyte response', summary: 'T-cells and B-cells work together to destroy threats and create memory.', color: CHUNK_COLORS[1] },
  { label: 'Vaccines & disorders', summary: 'Vaccines train immunity; autoimmune diseases and inflammation arise from dysregulation.', color: CHUNK_COLORS[2] },
]

const LEAF_GROUPS = [
  TOPIC_GROUPS[0].indices,
  TOPIC_GROUPS[1].indices,
  [...TOPIC_GROUPS[2].indices, ...TOPIC_GROUPS[3].indices],
]

export default function HierarchicalChunking() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <SectionHeader
        title="Hierarchical / RAPTOR chunking"
        description="Leaf chunks (fine-grained sentences) are clustered by topic and recursively summarised into parent nodes. At query time you can retrieve at any level: leaf for specifics, parent for broad context. Click a parent to expand its leaves."
      />

      <div style={{ marginBottom: 16 }}>
        <Label>Level 2 — Parent summaries (broad context retrieval)</Label>
        {PARENTS.map((p, pi) => (
          <div key={pi}>
            <ChunkCard
              borderColor={p.color.border}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setExpanded(expanded === pi ? null : pi)}
              >
                <div>
                  <Badge color={p.color.badge.text} bg={p.color.badge.bg}>Parent {pi + 1}: {p.label}</Badge>
                  <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">
                    {LEAF_GROUPS[pi].length} leaf chunks
                  </Badge>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {expanded === pi ? '▲ collapse' : '▼ expand'}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>
                {p.summary}
              </div>
            </ChunkCard>

            {expanded === pi && (
              <div style={{ paddingLeft: 20 }}>
                <Label>Level 1 — Leaf chunks</Label>
                {LEAF_GROUPS[pi].map((si, li) => (
                  <ChunkCard key={li} borderColor="rgba(255,255,255,0.1)" style={{ marginBottom: 6 }}>
                    <Badge color={p.color.badge.text} bg={p.color.badge.bg}>
                      P{pi + 1} → Leaf {li + 1}
                    </Badge>
                    <span style={{ color: 'var(--text2)', marginLeft: 4 }}>{SENTENCES[si]}</span>
                  </ChunkCard>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Card>
        <Label>Query-time retrieval example</Label>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          Query: <strong style={{ color: 'var(--accent2)' }}>"How do vaccines work?"</strong>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { step: 1, text: 'Embed query → ANN search over parent summaries', result: 'Parent 3 matched (vaccines & disorders)', color: CHUNK_COLORS[2].badge.text },
            { step: 2, text: 'Drill into Parent 3 leaves → ANN search over leaf vectors', result: 'Leaf 1 of P3 matched (vaccine sentence)', color: CHUNK_COLORS[2].badge.text },
            { step: 3, text: 'Return both parent summary + leaf chunk as context', result: 'LLM receives broad + specific context', color: '#2dd4a0' },
          ].map(s => (
            <div key={s.step} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '8px 10px', borderRadius: 6, background: 'var(--bg4)',
            }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent2)', minWidth: 20 }}>
                {s.step}.
              </span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.text}</div>
                <div style={{ fontSize: 12, color: s.color, marginTop: 2 }}>→ {s.result}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
