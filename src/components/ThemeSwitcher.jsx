import { useEffect, useState } from 'react'

export const THEMES = [
  { id: 'midnight', label: 'Midnight', dark: true },
  { id: 'slate', label: 'Slate', dark: true },
  { id: 'ember', label: 'Ember', dark: true },
  { id: 'daylight', label: 'Daylight', dark: false },
  { id: 'paper', label: 'Paper', dark: false },
]

const STORAGE_KEY = 'rag-visualizer:theme'

/** Whatever the pre-paint script in index.html already resolved, or the default. */
function currentTheme() {
  if (typeof document === 'undefined') return 'midnight'
  const attr = document.documentElement.getAttribute('data-theme')
  return THEMES.some(t => t.id === attr) ? attr : 'midnight'
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(currentTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    // Keep the browser chrome in step with the page background.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute(
        'content',
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      )
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Storage being unavailable only costs the preference, not the theme.
    }
  }, [theme])

  return (
    <div className="theme-switcher" role="group" aria-label="Colour theme">
      {THEMES.map(t => (
        <button
          key={t.id}
          type="button"
          className="theme-dot"
          data-active={theme === t.id}
          aria-pressed={theme === t.id}
          title={t.label}
          onClick={() => setTheme(t.id)}
        >
          {/* The swatch previews the theme by rendering in that theme's own
              variables, so it stays accurate if a palette is edited. */}
          <span data-theme={t.id} className="theme-dot-swatch">
            <i style={{ background: 'var(--bg)' }} />
            <i style={{ background: 'var(--c1)' }} />
            <i style={{ background: 'var(--c2)' }} />
          </span>
          <span className="sr-only">{t.label}</span>
        </button>
      ))}
    </div>
  )
}
