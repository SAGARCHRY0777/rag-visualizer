import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { splitSentences } from '../lib/retrieval'
import { PRESETS, DEFAULT_PRESET } from '../data/presets'

/**
 * The document, query and candidate set that every tab reads from. Keeping
 * them here means text typed on the chunking tabs is the same text the
 * retrieval tabs score, and it survives a reload.
 */

const STORAGE_KEY = 'rag-visualizer:corpus:v1'

// Sample corpora live in their own module so build scripts can import them.
export { PRESETS, DEFAULT_PRESET } from '../data/presets'

const CorpusContext = createContext(null)

function loadInitial() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.document !== 'string' || !Array.isArray(parsed?.docs)) return null
    return parsed
  } catch {
    // A corrupt or unreadable entry should never keep the app from starting.
    return null
  }
}

export function CorpusProvider({ children }) {
  const initial = useMemo(() => loadInitial(), [])
  const [document, setDocument] = useState(initial?.document ?? DEFAULT_PRESET.document)
  const [query, setQuery] = useState(initial?.query ?? DEFAULT_PRESET.query)
  const [docs, setDocs] = useState(initial?.docs ?? DEFAULT_PRESET.docs)
  const [presetId, setPresetId] = useState(initial?.presetId ?? DEFAULT_PRESET.id)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ document, query, docs, presetId }))
    } catch {
      // Private-mode or quota errors are not worth interrupting the user over.
    }
  }, [document, query, docs, presetId])

  const applyPreset = useCallback(id => {
    const preset = PRESETS.find(p => p.id === id) ?? DEFAULT_PRESET
    setPresetId(preset.id)
    setDocument(preset.document)
    setQuery(preset.query)
    setDocs(preset.docs)
  }, [])

  const updateDoc = useCallback((id, text) => {
    setDocs(current => current.map(d => (d.id === id ? { ...d, text } : d)))
  }, [])

  const removeDoc = useCallback(id => {
    setDocs(current => (current.length <= 2 ? current : current.filter(d => d.id !== id)))
  }, [])

  const addDoc = useCallback(() => {
    setDocs(current => {
      // Ids are display labels, so pick the next free D-number rather than the
      // array length, which would collide after a removal.
      const used = new Set(current.map(d => d.id))
      let n = current.length + 1
      while (used.has(`D${n}`)) n++
      return [...current, { id: `D${n}`, text: '' }]
    })
  }, [])

  const sentences = useMemo(() => splitSentences(document), [document])

  const value = useMemo(() => ({
    document,
    setDocument,
    query,
    setQuery,
    docs,
    setDocs,
    addDoc,
    removeDoc,
    updateDoc,
    presetId,
    applyPreset,
    sentences,
    /** Documents with text, which is what the retrieval views should score. */
    activeDocs: docs.filter(d => d.text.trim()),
  }), [document, query, docs, addDoc, removeDoc, updateDoc, presetId, applyPreset, sentences])

  return <CorpusContext.Provider value={value}>{children}</CorpusContext.Provider>
}

export function useCorpus() {
  const ctx = useContext(CorpusContext)
  if (!ctx) throw new Error('useCorpus must be used inside a CorpusProvider')
  return ctx
}
