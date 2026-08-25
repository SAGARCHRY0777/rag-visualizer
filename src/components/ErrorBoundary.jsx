import React from 'react'

/**
 * Keeps a render error in one visualisation from blanking the whole page, and
 * offers a way out — the corpus lives in localStorage, so a bad paste would
 * otherwise reproduce the crash on every reload.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  handleReset = () => {
    try {
      localStorage.removeItem('rag-visualizer:corpus:v1')
    } catch {
      // Nothing to clear if storage is unavailable.
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{ maxWidth: 620, margin: '80px auto', padding: '0 24px' }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 10 }}>
          Something broke while rendering
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>
          This is a bug. Resetting clears the saved document and query and reloads the page.
        </p>
        <pre style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 12, fontSize: 12,
          color: 'var(--coral)', overflowX: 'auto', marginBottom: 16,
        }}>
          {String(this.state.error?.message ?? this.state.error)}
        </pre>
        <button type="button" className="ghost-btn" onClick={this.handleReset}>
          Reset and reload
        </button>
      </div>
    )
  }
}
