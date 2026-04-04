import React from 'react'

export function ScoreBar({ score, max = 1, color = '#7c6af7' }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{
        flex: 1, height: 6, background: 'var(--bg4)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', minWidth: 40, textAlign: 'right' }}>
        {score.toFixed(3)}
      </span>
    </div>
  )
}

export function RankBadge({ rank }) {
  const colors = [
    { bg: 'rgba(124,106,247,0.2)', text: '#a78bfa' },
    { bg: 'rgba(45,212,160,0.2)', text: '#2dd4a0' },
    { bg: 'rgba(245,166,35,0.2)', text: '#f5a623' },
    { bg: 'rgba(144,144,168,0.15)', text: '#9090a8' },
    { bg: 'rgba(144,144,168,0.1)', text: '#5a5a72' },
  ]
  const c = colors[Math.min(rank - 1, colors.length - 1)]
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
      border: `1px solid var(--border)`,
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

export function Label({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600,
      color: 'var(--text3)', textTransform: 'uppercase',
      letterSpacing: '0.06em', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

export function SliderRow({ label, min, max, value, step = 1, onChange, displayValue }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 100 }}>{label}</span>
      <input
        type="range" min={min} max={max} value={value} step={step}
        onChange={e => onChange(+e.target.value)}
        style={{ flex: 1, minWidth: 100, maxWidth: 200 }}
      />
      <span style={{ fontSize: 13, fontWeight: 500, minWidth: 40, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
        {displayValue ?? value}
      </span>
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

export function ResultRow({ rank, text, extra, score, scoreColor, scoreMax }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      background: rank % 2 === 0 ? 'transparent' : 'var(--bg3)',
      marginBottom: 2,
    }}>
      <RankBadge rank={rank} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{text}</div>
        {extra}
        <ScoreBar score={score} max={scoreMax || 1} color={scoreColor || '#7c6af7'} />
      </div>
    </div>
  )
}
