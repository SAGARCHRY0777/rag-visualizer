import { useCallback, useEffect, useRef, useState } from 'react'
import FixedSize from './components/FixedSize'
import SentenceChunking from './components/SentenceChunking'
import SemanticChunking from './components/SemanticChunking'
import HierarchicalChunking from './components/HierarchicalChunking'
import CrossEncoder from './components/CrossEncoder'
import BiEncoder from './components/BiEncoder'
import ColBERT from './components/ColBERT'
import HybridRetrieval from './components/HybridRetrieval'
import { CorpusProvider } from './state/CorpusContext'
import ThemeSwitcher from './components/ThemeSwitcher'
import StarButton from './components/StarButton.jsx'

const REPO_URL = 'https://github.com/SAGARCHRY0777/rag-visualizer'

const TABS = [
  { id: 'fixed', group: 'chunking', label: 'Fixed-size', description: 'Split by token count + overlap', component: FixedSize },
  { id: 'sentence', group: 'chunking', label: 'Sentence', description: 'Split on punctuation boundaries', component: SentenceChunking },
  { id: 'semantic', group: 'chunking', label: 'Semantic', description: 'Split where embedding similarity drops', component: SemanticChunking },
  { id: 'hierarchical', group: 'chunking', label: 'Hierarchical', description: 'Multi-level parent/leaf tree (RAPTOR)', component: HierarchicalChunking },
  { id: 'bienc', group: 'retrieval', label: 'Bi-encoder', description: 'Independent vectors, cosine similarity', component: BiEncoder },
  { id: 'cross', group: 'retrieval', label: 'Cross-encoder', description: 'Joint query+doc scoring over a shortlist', component: CrossEncoder },
  { id: 'colbert', group: 'retrieval', label: 'ColBERT', description: 'Per-token MaxSim late interaction', component: ColBERT },
  { id: 'hybrid', group: 'retrieval', label: 'Hybrid RRF', description: 'BM25 + dense fused with RRF', component: HybridRetrieval },
]

const GROUPS = {
  chunking: { accent: 'var(--c1)', bg: 'var(--c1-bg)', label: 'Chunking' },
  retrieval: { accent: 'var(--c2)', bg: 'var(--c2-bg)', label: 'Retrieval' },
}

const GROUP_ORDER = ['chunking', 'retrieval']
const DEFAULT_TAB = TABS[0].id

function tabFromHash() {
  if (typeof window === 'undefined') return DEFAULT_TAB
  const id = window.location.hash.replace(/^#\/?/, '')
  return TABS.some(t => t.id === id) ? id : DEFAULT_TAB
}

export default function App() {
  const [active, setActive] = useState(tabFromHash)
  const tabRefs = useRef({})

  // The hash is the source of truth, so a tab can be linked to and survives a
  // reload or a back/forward navigation.
  useEffect(() => {
    const onHashChange = () => setActive(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectTab = useCallback(id => {
    setActive(id)
    if (window.location.hash !== `#/${id}`) {
      window.history.replaceState(null, '', `#/${id}`)
    }
  }, [])

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', `#/${DEFAULT_TAB}`)
  }, [])

  // Roving focus: arrow keys move between tabs, Home/End jump to the ends.
  const onTabKeyDown = useCallback(event => {
    const index = TABS.findIndex(t => t.id === active)
    let next = null
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    if (next === null) return
    event.preventDefault()
    const id = TABS[next].id
    selectTab(id)
    tabRefs.current[id]?.focus()
  }, [active, selectTab])

  const activeTab = TABS.find(t => t.id === active) ?? TABS[0]
  const ActiveComponent = activeTab.component
  const group = GROUPS[activeTab.group]

  return (
    <CorpusProvider>
      <a href="#main" className="skip-link">Skip to content</a>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="app-header">
          <div className="shell">
            <div className="header-top">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800,
                  color: 'var(--text)', letterSpacing: '-0.02em',
                }}>
                  RAG Visualizer
                </h1>
                <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  chunking · retrieval · reranking
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ThemeSwitcher />
                <StarButton />
              </div>
            </div>

            <div className="tabstrip" role="tablist" aria-label="Visualisation" onKeyDown={onTabKeyDown}>
              {GROUP_ORDER.map(groupId => {
                const gc = GROUPS[groupId]
                return (
                  <div key={groupId} className="tabgroup">
                    <span className="tabgroup-label" style={{ color: gc.accent }}>{gc.label}</span>
                    {TABS.filter(t => t.group === groupId).map(tab => {
                      const isActive = active === tab.id
                      return (
                        <button
                          key={tab.id}
                          ref={el => { tabRefs.current[tab.id] = el }}
                          id={`tab-${tab.id}`}
                          role="tab"
                          type="button"
                          aria-selected={isActive}
                          aria-controls="tabpanel"
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => selectTab(tab.id)}
                          className="tab"
                          style={{
                            borderBottomColor: isActive ? gc.accent : 'transparent',
                            color: isActive ? gc.accent : 'var(--text3)',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </header>

        <div className="subbar">
          <div className="shell" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: group.accent,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: group.bg, padding: '2px 8px', borderRadius: 99,
            }}>
              {group.label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{activeTab.description}</span>
          </div>
        </div>

        <main id="main" className="shell" style={{ flex: 1, padding: '28px 24px', width: '100%' }}>
          <div
            id="tabpanel"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
            tabIndex={-1}
          >
            <ActiveComponent key={activeTab.id} />
          </div>
        </main>

        <footer className="app-footer">
          <div className="shell">
            RAG Visualizer · React + Vite · every score on this page is computed in your browser
            <span style={{ margin: '0 8px' }}>·</span>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)' }}>
              Source
            </a>
          </div>
        </footer>
      </div>
    </CorpusProvider>
  )
}
