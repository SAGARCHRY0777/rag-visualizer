import React, { useState } from 'react'
import FixedSize from './components/FixedSize'
import SentenceChunking from './components/SentenceChunking'
import SemanticChunking from './components/SemanticChunking'
import HierarchicalChunking from './components/HierarchicalChunking'
import CrossEncoder from './components/CrossEncoder'
import BiEncoder from './components/BiEncoder'
import ColBERT from './components/ColBERT'
import HybridRetrieval from './components/HybridRetrieval'

const TABS = [
  {
    id: 'fixed', group: 'chunking', label: 'Fixed-size',
    shortLabel: 'Fixed',
    description: 'Split by token count + overlap',
    component: FixedSize,
  },
  {
    id: 'sentence', group: 'chunking', label: 'Sentence',
    shortLabel: 'Sentence',
    description: 'Split on punctuation boundaries',
    component: SentenceChunking,
  },
  {
    id: 'semantic', group: 'chunking', label: 'Semantic',
    shortLabel: 'Semantic',
    description: 'Split on embedding similarity drops',
    component: SemanticChunking,
  },
  {
    id: 'hierarchical', group: 'chunking', label: 'Hierarchical',
    shortLabel: 'RAPTOR',
    description: 'Multi-level parent/leaf tree',
    component: HierarchicalChunking,
  },
  {
    id: 'cross', group: 'reranking', label: 'Cross-encoder',
    shortLabel: 'Cross-enc',
    description: 'Joint query+doc transformer scoring',
    component: CrossEncoder,
  },
  {
    id: 'bienc', group: 'reranking', label: 'Bi-encoder',
    shortLabel: 'Bi-enc',
    description: 'Independent vector cosine retrieval',
    component: BiEncoder,
  },
  {
    id: 'colbert', group: 'reranking', label: 'ColBERT',
    shortLabel: 'ColBERT',
    description: 'Per-token MaxSim late interaction',
    component: ColBERT,
  },
  {
    id: 'hybrid', group: 'reranking', label: 'Hybrid RRF',
    shortLabel: 'Hybrid',
    description: 'BM25 + dense fused via RRF',
    component: HybridRetrieval,
  },
]

const GROUP_COLORS = {
  chunking: { accent: '#7c6af7', bg: 'rgba(124,106,247,0.12)', label: 'Chunking' },
  reranking: { accent: '#2dd4a0', bg: 'rgba(45,212,160,0.12)', label: 'Reranking' },
}

export default function App() {
  const [active, setActive] = useState('fixed')
  const activeTab = TABS.find(t => t.id === active)
  const ActiveComponent = activeTab?.component

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ paddingTop: 20, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 style={{
                fontFamily: 'var(--display)',
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}>
                RAG Visualizer
              </h1>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                chunking · reranking · retrieval
              </span>
            </div>
          </div>

          {/* Tab groups */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['chunking', 'reranking'].map(group => {
              const gc = GROUP_COLORS[group]
              const tabs = TABS.filter(t => t.group === group)
              return (
                <div key={group} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: gc.accent,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '0 10px',
                    display: 'flex', alignItems: 'center',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '2px solid transparent',
                    whiteSpace: 'nowrap',
                  }}>
                    {gc.label}
                  </div>
                  {tabs.map(tab => {
                    const isActive = active === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActive(tab.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: isActive
                            ? `2px solid ${gc.accent}`
                            : '2px solid transparent',
                          color: isActive ? gc.accent : 'var(--text3)',
                          padding: '10px 14px',
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--sans)',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.target.style.color = 'var(--text2)' }}
                        onMouseLeave={e => { if (!isActive) e.target.style.color = 'var(--text3)' }}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                  {group === 'chunking' && (
                    <div style={{ width: 1, background: 'var(--border)', margin: '4px 8px' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* Active tab description bar */}
      {activeTab && (
        <div style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg2)',
          padding: '8px 24px',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: GROUP_COLORS[activeTab.group].accent,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: GROUP_COLORS[activeTab.group].bg,
              padding: '2px 8px', borderRadius: 99,
            }}>
              {GROUP_COLORS[activeTab.group].label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{activeTab.description}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {ActiveComponent && <ActiveComponent />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text3)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          RAG Visualizer · Built with React + Vite · Deployed on GitHub Pages
          <span style={{ margin: '0 8px' }}>·</span>
          <a
            href="https://github.com/your-username/rag-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent2)', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
