# 🚀 RAG Visualizer

> An interactive visual playground for understanding **Retrieval-Augmented Generation (RAG)** — covering every major chunking strategy and retrieval/reranking method with live, hands-on examples.

🔗 **Live Demo:** https://SAGARCHRY0777.github.io/rag-visualizer/

📦 **GitHub Repo:** https://github.com/SAGARCHRY0777/rag-visualizer
---
## 🎯 Why this project matters

This project helps understand real-world Retrieval-Augmented Generation (RAG) pipelines by visualizing:

- How different chunking strategies affect retrieval quality
- Trade-offs between bi-encoder vs cross-encoder models
- How hybrid retrieval (BM25 + dense) improves results
- Token-level interaction in advanced models like ColBERT

It is designed as an educational + interview-ready tool for learning modern LLM systems.

## What is this?

RAG is the technique of retrieving relevant documents from a knowledge base and injecting them into an LLM prompt before generating an answer. The quality of what gets retrieved — and how it's prepared — determines everything about the output quality.

This visualizer breaks down **two critical stages** of every RAG pipeline:

1. **Chunking** — how raw documents are split into retrievable pieces
2. **Retrieval & Reranking** — how the right pieces are found and ranked for a query

## 🧠 Built for

- Students learning LLM / RAG systems
- ML engineers exploring retrieval pipelines
- Interview preparation (system design + NLP)
  
---

## Features

### Chunking strategies (4 types)

| Tab | What it shows |
|-----|---------------|
| **Fixed-size** | Adjustable token window + overlap slider. See exactly how chunks split and where context is preserved or lost. |
| **Sentence** | NLP-boundary chunking. Group N complete sentences per chunk, no mid-sentence cuts. |
| **Semantic** | Embedding-based topic detection. Live similarity scores between adjacent sentences; split threshold slider controls sensitivity. |
| **Hierarchical (RAPTOR)** | Two-level parent/leaf tree. Click parents to expand their leaf chunks. Shows how broad + precise context is retrieved together. |

### Retrieval & Reranking methods (4 types)

| Tab | What it shows |
|-----|---------------|
| **Cross-encoder** | Joint query+document transformer input, precise relevance scores. See why semantic paraphrases rank higher than keyword matches. |
| **Bi-encoder** | Independent vector encoding, cosine similarity. Displays raw 6-dim embeddings + scores. Explains the speed/accuracy tradeoff. |
| **ColBERT / Late interaction** | Per-token MaxSim scoring. Click any query token to highlight its best-matching document tokens across all candidates. |
| **Hybrid RRF** | BM25 (keyword) + dense (semantic) retrieval fused with Reciprocal Rank Fusion. See how conflicting ranked lists get merged. |

---

## Tech stack

- **React 18** + **Vite 5** — fast dev server, optimised production build
- **Zero dependencies** beyond React — all scoring logic is pure JS
- **GitHub Actions** — automatic deployment to GitHub Pages on every push to `main`
- **Google Fonts** — Syne (display) + DM Sans (body) + JetBrains Mono (code)

---

## Run locally

```bash
git clone https://github.com/SAGARCHRY0777/rag-visualizer.git
cd rag-visualizer
npm install
npm run dev
```

Opens at `http://localhost:5173/rag-visualizer/`

---

## Deploy to GitHub Pages

This repo is pre-configured for zero-config GitHub Pages deployment.

### Step 1 — Enable GitHub Pages in your repo settings

1. Go to your repo on GitHub
2. Click **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. Save

### Step 2 — Push to main

```bash
git add .
git commit -m "deploy"
git push origin main
```

The workflow in `.github/workflows/deploy.yml` automatically:
- Installs dependencies
- Runs `vite build`
- Uploads the `dist/` folder to GitHub Pages

Your live URL will be: `https://YOUR-USERNAME.github.io/rag-visualizer/`

> **Note:** Replace `YOUR-USERNAME` with your actual GitHub username in `vite.config.js` if you rename the repo.

---

## Project structure

```
rag-visualizer/
├── index.html                       # Vite entry point + Google Fonts
├── vite.config.js                   # base: '/rag-visualizer/' for GH Pages
├── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml               # GitHub Actions deploy pipeline
└── src/
    ├── main.jsx                     # React root
    ├── App.jsx                      # Tab navigation + layout
    ├── index.css                    # Dark theme + CSS variables
    ├── data/
    │   └── ragData.js               # All sample data + helper functions
    └── components/
        ├── UI.jsx                   # Shared: ScoreBar, Badge, Card, etc.
        ├── FixedSize.jsx            # Fixed-size chunking demo
        ├── SentenceChunking.jsx     # Sentence boundary chunking demo
        ├── SemanticChunking.jsx     # Semantic / embedding-based chunking
        ├── HierarchicalChunking.jsx # RAPTOR hierarchical chunking
        ├── CrossEncoder.jsx         # Cross-encoder reranking demo
        ├── BiEncoder.jsx            # Bi-encoder retrieval demo
        ├── ColBERT.jsx              # ColBERT late interaction demo
        └── HybridRetrieval.jsx      # Hybrid BM25 + dense + RRF demo
```

---

## Concepts explained

### Why chunking matters

LLMs have context windows. You can't feed an entire document — you must split it. But *how* you split determines what the retriever finds. A fixed split might cut a sentence in half; a semantic split respects topic boundaries.

### Why reranking matters

Bi-encoders are fast but imprecise — they encode query and document separately. Cross-encoders are slow but accurate — they see both together. The standard RAG pipeline uses **bi-encoder for recall** (retrieve top 50) then **cross-encoder for precision** (rerank to top 5).

### RRF fusion

Reciprocal Rank Fusion: `score = 1/(k + rank_bm25) + 1/(k + rank_dense)` with k=60. No score normalisation needed. Documents that rank consistently high in both methods win. Documents that rank high in only one get partially penalised.

---

## License

MIT — feel free to fork, modify, and use in your own projects.

---

*Built as an educational tool for understanding RAG pipelines. All scoring is simulated/illustrative, not backed by real transformer models.*
