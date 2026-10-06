import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Every theme is fifteen values, and the text tones are picked by eye. A tone
   that looks fine on one background can fail WCAG AA on another, and nothing
   in the build notices. --text3 is the colour of the tab labels, so it has to
   clear 4.5:1 against every surface it is set on. */

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

const luminance = (hex) => {
  const ch = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Every `[data-theme='x'] { ... }` block, plus the :root default that shares one. */
export function themes() {
  const out = {}
  for (const m of css.matchAll(/\[data-theme='([a-z]+)'\]\s*\{([^}]*)\}/g)) {
    const vars = {}
    for (const v of m[2].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) vars[v[1]] = v[2]
    if (vars.bg) out[m[1]] = vars
  }
  return out
}

const AA = 4.5

test('every theme defines the tones the UI reads', () => {
  const t = themes()
  assert.ok(Object.keys(t).length >= 5, `found ${Object.keys(t).length} themes, expected 5+`)
  for (const [name, v] of Object.entries(t)) {
    for (const k of ['bg', 'bg2', 'text', 'text2', 'text3']) {
      assert.ok(v[k], `${name} is missing --${k}`)
    }
  }
})

test('--text3 clears WCAG AA on every surface it sits on', () => {
  const failures = []
  for (const [name, v] of Object.entries(themes())) {
    // text3 is used on the page background and on raised panels alike.
    for (const surface of ['bg', 'bg2', 'bg3']) {
      if (!v[surface]) continue
      const ratio = contrast(v.text3, v[surface])
      if (ratio < AA) failures.push(`${name}: --text3 ${v.text3} on --${surface} ${v[surface]} = ${ratio.toFixed(2)}:1`)
    }
  }
  assert.deepEqual(failures, [], `\n  ${failures.join('\n  ')}\n`)
})

test('--text and --text2 clear AA on the page background', () => {
  const failures = []
  for (const [name, v] of Object.entries(themes())) {
    for (const tone of ['text', 'text2']) {
      const ratio = contrast(v[tone], v.bg)
      if (ratio < AA) failures.push(`${name}: --${tone} ${v[tone]} on --bg = ${ratio.toFixed(2)}:1`)
    }
  }
  assert.deepEqual(failures, [], `\n  ${failures.join('\n  ')}\n`)
})
