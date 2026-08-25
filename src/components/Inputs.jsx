import { useId, useState } from 'react'
import { PRESETS, useCorpus } from '../state/CorpusContext'
import { Label } from './UI'
import { projectVector } from '../lib/retrieval'

const panelStyle = {
  background: 'var(--bg3)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '12px 14px',
  marginBottom: 16,
}

const fieldStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  fontSize: 13,
  lineHeight: 1.6,
  padding: '10px 12px',
  resize: 'vertical',
}

export function PresetPicker() {
  const { presetId, applyPreset } = useCorpus()
  const id = useId()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label htmlFor={id} style={{ fontSize: 12, color: 'var(--text3)' }}>Sample corpus</label>
      <select
        id={id}
        value={presetId}
        onChange={e => applyPreset(e.target.value)}
        style={{
          background: 'var(--bg4)', color: 'var(--text)',
          border: '1px solid var(--border2)', borderRadius: 6,
          fontSize: 12, padding: '4px 8px', fontFamily: 'var(--sans)', cursor: 'pointer',
        }}
      >
        {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </div>
  )
}

/** The document every chunking view splits. Editable, with a preset fallback. */
export function DocumentInput({ hint }) {
  const { document, setDocument, presetId, applyPreset } = useCorpus()
  const [open, setOpen] = useState(false)
  const id = useId()
  const wordCount = document.trim() ? document.trim().split(/\s+/).length : 0

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Label>Your document</Label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <PresetPicker />
          <button type="button" className="ghost-btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={id}>
            {open ? 'Hide editor' : 'Edit text'}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <textarea
            id={id}
            value={document}
            onChange={e => setDocument(e.target.value)}
            rows={8}
            spellCheck={false}
            aria-label="Document text to chunk"
            style={fieldStyle}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              {wordCount} words
            </span>
            <button type="button" className="ghost-btn" onClick={() => applyPreset(presetId)}>
              Reset to sample
            </button>
          </div>
        </>
      ) : (
        <p id={id} style={{
          fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
          maxHeight: 72, overflow: 'hidden', margin: 0,
          maskImage: 'linear-gradient(180deg, #000 55%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 55%, transparent)',
        }}>
          {document || 'No document yet — click Edit text to paste your own.'}
        </p>
      )}

      {hint && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{hint}</div>
      )}
    </div>
  )
}

/** The query every retrieval view scores against, plus the candidate documents. */
export function QueryPanel({ showDocs = true }) {
  const { query, setQuery, docs, addDoc, removeDoc, updateDoc, presetId, applyPreset } = useCorpus()
  const [open, setOpen] = useState(false)
  const queryId = useId()
  const docsId = useId()

  return (
    <div style={panelStyle}>
      <Label>Your query</Label>
      <input
        id={queryId}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Ask something about your documents…"
        aria-label="Search query"
        style={{ ...fieldStyle, fontSize: 14, color: 'var(--accent2)' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <PresetPicker />
        {showDocs && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="ghost-btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={docsId}>
              {open ? 'Hide documents' : `Edit documents (${docs.length})`}
            </button>
            <button type="button" className="ghost-btn" onClick={() => applyPreset(presetId)}>
              Reset
            </button>
          </div>
        )}
      </div>

      {showDocs && open && (
        <div id={docsId} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)',
                minWidth: 26, paddingTop: 10,
              }}>
                {doc.id}
              </span>
              <textarea
                value={doc.text}
                onChange={e => updateDoc(doc.id, e.target.value)}
                rows={2}
                spellCheck={false}
                aria-label={`Document ${doc.id} text`}
                style={{ ...fieldStyle, fontSize: 12 }}
              />
              <button
                type="button"
                className="ghost-btn"
                onClick={() => removeDoc(doc.id)}
                disabled={docs.length <= 2}
                aria-label={`Remove document ${doc.id}`}
                style={{ marginTop: 6 }}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="ghost-btn" onClick={addDoc} style={{ alignSelf: 'flex-start' }}>
            + Add document
          </button>
        </div>
      )}
    </div>
  )
}

/** Draws a vector as a strip of bars — a readable stand-in for 256 raw floats. */
export function VectorStrip({ vec, color = '#7c6af7', height = 22, label }) {
  const bars = projectVector(vec)
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontFamily: 'var(--mono)' }}>{label}</div>}
      <div
        style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}
        role="img"
        aria-label={label ? `${label} embedding fingerprint` : 'Embedding fingerprint'}
      >
        {bars.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(6, v * 100)}%`,
              background: color,
              opacity: 0.25 + v * 0.75,
              borderRadius: 1,
              minWidth: 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ children }) {
  return (
    <div style={{
      border: '1px dashed var(--border2)',
      borderRadius: 10,
      padding: '20px 16px',
      textAlign: 'center',
      color: 'var(--text3)',
      fontSize: 13,
    }}>
      {children}
    </div>
  )
}
