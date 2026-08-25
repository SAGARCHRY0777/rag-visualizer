import { useId } from 'react'

export function ScoreBar({ score, max = 1, color = '#7c6af7', digits = 3 }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{
        flex: 1, height: 6, background: 'var(--bg4)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div
          className="bar-fill"
          style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', minWidth: 40, textAlign: 'right' }}>
        {score.toFixed(digits)}
      </span>
    </div>
  )
}

const RANK_COLORS = [
  { bg: 'rgba(124,106,247,0.2)', text: '#a78bfa' },
  { bg: 'rgba(45,212,160,0.2)', text: '#2dd4a0' },
  { bg: 'rgba(245,166,35,0.2)', text: '#f5a623' },
  { bg: 'rgba(144,144,168,0.15)', text: '#9090a8' },
  { bg: 'rgba(144,144,168,0.1)', text: '#5a5a72' },
]

export function RankBadge({ rank }) {
  const idx = Math.min(Math.max(rank - 1, 0), RANK_COLORS.length - 1)
  const c = RANK_COLORS[idx]
  return (
    <div style={{
      minWidth: 28, height: 24, borderRadius: 12,
      background: c.bg, color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
      flexShrink: 0,
    }}>
      #{rank}
    </div>
  )
}

export function Badge({ children, color = '#7c6af7', bg }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 99,
      background: bg || `${color}22`,
      color, marginRight: 4,
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  )
}

export function ChunkCard({ children, borderColor = 'var(--border2)', style = {} }) {
  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 8,
      padding: '10px 14px',
      marginBottom: 8,
      fontSize: 13,
      lineHeight: 1.65,
      color: 'var(--text)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Label({ children, id }) {
  return (
    <div id={id} style={{
      fontSize: 11, fontWeight: 600,
      color: 'var(--text3)', textTransform: 'uppercase',
      letterSpacing: '0.06em', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

export function SliderRow({ label, min, max, value, step = 1, onChange, displayValue, hint }) {
  const id = useId()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      <label htmlFor={id} style={{ fontSize: 13, color: 'var(--text2)', minWidth: 100 }}>
        {label}
      </label>
      <input
        id={id}
        type="range" min={min} max={max} value={value} step={step}
        onChange={e => onChange(+e.target.value)}
        aria-valuetext={String(displayValue ?? value)}
        style={{ flex: 1, minWidth: 100, maxWidth: 200 }}
      />
      <span style={{ fontSize: 13, fontWeight: 500, minWidth: 40, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
        {displayValue ?? value}
      </span>
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{hint}</span>
      )}
    </div>
  )
}

export function SectionHeader({ title, description }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 640 }}>
        {description}
      </p>
    </div>
  )
}

export function Formula({ children, note }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent2)', marginBottom: 6 }}>
        {children}
      </div>
      {note && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{note}</div>}
    </>
  )
}

/**
 * One row of a ranked result list: rank badge, document id, text, optional
 * detail line, and a score bar. Shared by the bi-encoder and cross-encoder
 * views, which rank the same way but score differently.
 */
export function RankedRow({ rank, id, text, detail, score, scoreColor, scoreMax = 1, scoreDigits = 3 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      background: rank % 2 === 1 ? 'var(--bg3)' : 'transparent',
      marginBottom: 4,
    }}>
      <RankBadge rank={rank} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {id && (
          <div style={{ marginBottom: 4 }}>
            <Badge color="var(--text3)" bg="rgba(255,255,255,0.05)">{id}</Badge>
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 5, lineHeight: 1.5 }}>{text}</div>
        {detail && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 5, wordBreak: 'break-word' }}>
            {detail}
          </div>
        )}
        <ScoreBar score={score} max={scoreMax} color={scoreColor} digits={scoreDigits} />
      </div>
    </div>
  )
}

/** Two-up comparison panels that collapse to a single column on narrow screens. */
export function CompareGrid({ columns }) {
  return (
    <div className="compare-grid">
      {columns.map(col => (
        <div key={col.title} style={{ background: 'var(--bg4)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: col.color, marginBottom: 8 }}>{col.title}</div>
          {col.points.map((p, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>· {p}</div>
          ))}
        </div>
      ))}
    </div>
  )
}
