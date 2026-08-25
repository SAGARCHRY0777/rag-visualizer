# RAG Visualizer

An interactive playground for the two stages that decide whether a RAG pipeline
works: **how documents get split**, and **how the right pieces get found**.

Paste your own text, type your own query, and watch every chunk boundary and
similarity score recompute live. Nothing is pre-baked and nothing is called over
the network — the embeddings, BM25 scores and fusion ranks are all computed in
your browser from whatever you type.

🔗 **Live demo:** https://SAGARCHRY0777.github.io/rag-visualizer/

---

## What you can do with it

| | |
|---|---|
| **Bring your own text** | Replace the document and the candidate set on any tab. Chunk boundaries, similarities and rankings all follow. |
| **Bring your own query** | One query drives the bi-encoder, cross-encoder, ColBERT and hybrid tabs at once, so you can compare how each method reacts to the same wording. |
| **Switch corpora** | Three built-in sample corpora (immunology, databases, climate) to see how the same method behaves on different vocabulary. |
| **Deep-link a tab** | Every view has its own URL (`#/colbert`), so a specific visualisation can be linked or bookmarked. |
| **Keep your work** | The document, query and candidate set persist across reloads. |
| **Pick a theme** | Five palettes, light and dark. Your choice is remembered and applied before first paint, so there's no flash on load. |

Your edits stay on your machine — they are kept in `localStorage` and never sent anywhere.

---

## Themes

The switcher sits in the header. On a first visit the theme follows your
system's light/dark preference.

| | | |
|:---:|:---:|:---:|
| ![Midnight](docs/screenshots/themes/midnight.png) | ![Slate](docs/screenshots/themes/slate.png) | ![Ember](docs/screenshots/themes/ember.png) |
| **Midnight** — default dark | **Slate** — cool neutral dark | **Ember** — warm dark |
| ![Daylight](docs/screenshots/themes/daylight.png) | ![Paper](docs/screenshots/themes/paper.png) | |
| **Daylight** — clean light | **Paper** — warm light | |

Each theme defines only **fifteen values**: nine neutrals and a six-colour ramp.
Every badge tint, border and readable-on-tint text colour is derived from those
with `color-mix()`, including against `--text` — so the same rule darkens in a
light theme and lightens in a dark one automatically. Adding a theme is one
fifteen-line block in [src/index.css](src/index.css); nothing else changes.

The ramp carries meaning and stays distinguishable in every theme: `c1`
chunking, `c2` retrieval and success, `c3` splits and negatives, `c4` overlap
and BM25, `c5`/`c6` further chunk colours.

---

## The eight views

### Chunking

<table>
<tr><td width="50%">

**Fixed-size** — split every N tokens with an overlap O. The stat row makes the
real cost visible: how many tokens are duplicated, and what share of your index
is repeated text.

</td><td width="50%">

**Sentence** — group N whole sentences per chunk. Reports the spread between
your shortest and longest chunk, which is the trade-off you accept for never
cutting mid-thought.

</td></tr>
<tr><td>

![Fixed-size chunking](docs/screenshots/fixed.png)

</td><td>

![Sentence chunking](docs/screenshots/sentence.png)

</td></tr>
<tr><td>

**Semantic** — embeds every sentence, measures cosine similarity between
adjacent pairs, and splits where it drops. The threshold slider rescales itself
to the range your document actually produces.

</td><td>

**Hierarchical (RAPTOR)** — cuts the document at its weakest boundaries to build
parent nodes, then shows a real two-level query drill-down: score the parents,
descend into the winner only.

</td></tr>
<tr><td>

![Semantic chunking](docs/screenshots/semantic.png)

</td><td>

![Hierarchical chunking](docs/screenshots/hierarchical.png)

</td></tr>
</table>

### Retrieval & reranking

<table>
<tr><td width="50%">

**Bi-encoder** — query and documents encoded independently, compared by cosine.
Each embedding is drawn as a fingerprint strip so you can see similarity as
shape overlap rather than a bare number.

</td><td width="50%">

**Cross-encoder** — a genuine two-stage pipeline. Stage 1 retrieves over
everything, stage 2 reranks only the shortlist, and each result is tagged with
how far it moved (▲/▼) between the two.

</td></tr>
<tr><td>

![Bi-encoder](docs/screenshots/bienc.png)

</td><td>

![Cross-encoder reranking](docs/screenshots/cross.png)

</td></tr>
<tr><td>

**ColBERT** — per-token MaxSim. Select any query token to see its similarity
against *every* token of every document, with the winning token outlined — the
only value that enters the sum.

</td><td>

**Hybrid RRF** — real BM25 and dense retrieval fused with Reciprocal Rank
Fusion, including per-term BM25 contributions and a live `k` slider.

</td></tr>
<tr><td>

![ColBERT late interaction](docs/screenshots/colbert.png)

</td><td>

![Hybrid RRF](docs/screenshots/hybrid.png)

</td></tr>
</table>

---

## Results

Every number below is produced by the same functions the app runs in the
browser, regenerated with `npm run results` — so the docs and the live site
cannot drift apart. Full tables for all three corpora: **[docs/RESULTS.md](docs/RESULTS.md)**.

### Immunology · _"How does the immune system fight viruses?"_

| Doc | Text | BM25 | Dense | Cross-enc | ColBERT | Hybrid RRF |
|---|---|---|---|---|---|---|
| `D3` | The immune system uses antibodies to neutralise viruses. | #1 · 3.809 | #1 · 0.678 | #1 · 0.954 | #1 · 3.183 | 0.03279 |
| `D4` | Fever is a systemic immune response to infection. | #2 · 0.700 | #2 · 0.463 | #2 · 0.522 | #3 · 1.922 | 0.03226 |
| `D2` | T-cells and B-cells are key immune lymphocytes fighting viral infections. | #3 · 0.630 | #3 · 0.311 | #3 · 0.481 | #2 · 2.063 | 0.03175 |
| `D1` | White blood cells destroy pathogens through phagocytosis. | #4 · 0.000 | #6 · 0.044 | #6 · 0.034 | #6 · 0.258 | 0.03078 |
| `D6` | Python is widely used for machine learning projects. | #6 · 0.000 | #4 · 0.174 | #4 · 0.060 | #4 · 0.510 | 0.03078 |
| `D5` | Stocks surged after the Federal Reserve policy announcement. | #5 · 0.000 | #5 · 0.147 | #5 · 0.051 | #5 · 0.418 | 0.03077 |

Two things worth reading off this table:

- **`D1` has no query term in it at all.** BM25 scores it 0.000 and cannot rank it
  meaningfully, so its BM25 position (#4) is an artefact of ties. Only the dense
  side has an opinion — the lexical gap in miniature.
- **ColBERT and the bi-encoder disagree** on `D2` vs `D4`. `D2` says *"fighting
  viral infections"* — a paraphrase spread across several tokens. Averaging it
  into one vector dilutes it to #3; MaxSim lets each query token find its own
  evidence and lifts it to #2.

### Climate · _"What makes sea levels rise?"_

The clearest lexical-gap case in the sample data:

| Doc | Text | BM25 | Dense | Hybrid RRF |
|---|---|---|---|---|
| `D1` | Thermal expansion of warming seawater accounts for much of observed sea level rise. | #1 · 2.376 | #1 · 0.588 | 0.03279 |
| `D2` | Melting glaciers and ice sheets add freshwater volume to the oceans. | #3 · 0.000 | #6 · 0.023 | 0.03102 |

`D2` is a genuinely correct answer to the query and **both** retrievers miss it —
it shares no vocabulary with the question at all. This is the honest failure mode
of lexical and shallow-semantic retrieval, and it is left in rather than tuned away.

---

## How the scoring works

There is no model download and no API call. `src/lib/retrieval.js` provides:

| Component | Implementation |
|---|---|
| **Embeddings** | Hashed character-trigram bag, 256 dimensions, unit-normalised. Words sharing substrings share features, so `viral`↔`virus` scores **0.338** while `virus`↔`stocks` scores **exactly 0**. |
| **BM25** | The real formula, `k1=1.5`, `b=0.75`, with proper IDF and length normalisation. Per-term contributions are exposed in the UI. |
| **ColBERT MaxSim** | The real formula — full query×document similarity matrix, row-wise argmax, summed. |
| **RRF** | The real formula, `1/(k + rank)` summed across lists, with `k` adjustable. |
| **Cross-encoder** | **A heuristic stand-in**, not a trained model — token-level soft matching blended with whole-text similarity through a sigmoid. Labelled as such in the UI. |

Character trigrams are what make paraphrase work without a trained model: `virus`
and `viral` both contain `#vi` and `vir`, so they land near each other, while
unrelated words collide in none of the 256 buckets and score a clean zero.

---

## Running it

```bash
git clone https://github.com/SAGARCHRY0777/rag-visualizer.git
cd rag-visualizer
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint 9 flat config |
| `npm test` | Unit tests for the retrieval engine (`node --test`) |
| `npm run check` | lint + test + build — what CI runs |
| `npm run results` | Regenerate `docs/RESULTS.md` from the live code |
| `npm run shots` | Recapture `docs/screenshots/` by driving local Chrome |

Requires Node 20+. `npm run shots` additionally needs Google Chrome installed —
it drives your existing browser via `playwright-core` rather than downloading one.

---

## Project layout

```
src/
  lib/retrieval.js        embeddings, BM25, MaxSim, RRF — no dependencies
  state/CorpusContext.jsx shared document/query/candidates, persisted
  data/presets.js         the three sample corpora
  data/palette.js         chunk colours
  components/
    UI.jsx                shared primitives (score bars, rank badges, cards)
    Inputs.jsx            document + query editors, vector strips
    ErrorBoundary.jsx     keeps a render error from blanking the page
    *.jsx                 the eight visualisations
scripts/
  results.mjs             regenerates docs/RESULTS.md
  screenshots.mjs         regenerates docs/screenshots/
tests/
  retrieval.test.js       12 tests over the scoring engine
```

---

## Accessibility

The tab strip is a proper `tablist` with arrow-key, Home and End navigation and
roving `tabindex`. Every slider and text field is labelled, the RAPTOR accordion
reports `aria-expanded`, there is a skip-to-content link, focus is always
visible, and `prefers-reduced-motion` is respected. Layout reflows to a single
column on narrow screens, and the one table too wide to reflow scrolls inside
its own container rather than the page.

---

## License

[MIT](LICENSE)
