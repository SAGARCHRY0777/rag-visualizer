export const RAG_TEXT =
  "The immune system is the body's defense against disease. It identifies pathogens such as bacteria and viruses. White blood cells called lymphocytes are central to this response. T-cells destroy infected cells directly. B-cells produce antibodies that neutralise threats. Memory cells allow faster responses to repeat infections. Vaccines train this system using weakened pathogens. Autoimmune diseases occur when the system attacks healthy tissue. Inflammation is an early warning signal of immune activation. The complement system enhances antibody effects on pathogens."

export const SENTENCES = RAG_TEXT.match(/[^.!?]+[.!?]+/g).map(s => s.trim())

export function words(str) {
  return str.split(/\s+/).filter(Boolean)
}

export function cosine(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0)
  const ma = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const mb = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  return dot / (ma * mb)
}

export const CHUNK_COLORS = [
  { border: '#7c6af7', badge: { bg: 'rgba(124,106,247,0.15)', text: '#a78bfa' } },
  { border: '#2dd4a0', badge: { bg: 'rgba(45,212,160,0.15)', text: '#2dd4a0' } },
  { border: '#f97066', badge: { bg: 'rgba(249,112,102,0.15)', text: '#f97066' } },
  { border: '#f5a623', badge: { bg: 'rgba(245,166,35,0.15)', text: '#f5a623' } },
  { border: '#60a5fa', badge: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' } },
  { border: '#e879f9', badge: { bg: 'rgba(232,121,249,0.15)', text: '#e879f9' } },
]

export const TOPIC_GROUPS = [
  { indices: [0, 1, 2], label: 'Immune basics' },
  { indices: [3, 4, 5], label: 'Lymphocyte types' },
  { indices: [6], label: 'Vaccines' },
  { indices: [7, 8, 9], label: 'Disorders & signals' },
]

export const CROSS_CHUNKS = [
  { id: 'C1', text: 'White blood cells detect foreign antigens on bacteria surfaces.', score: 0.61 },
  { id: 'C2', text: 'Vaccines contain weakened or inactivated pathogens to stimulate immunity.', score: 0.55 },
  { id: 'C3', text: 'T-cells and B-cells coordinate to eliminate intracellular infections including viral ones.', score: 0.93 },
  { id: 'C4', text: 'Inflammation is triggered when tissue damage or pathogen invasion is detected.', score: 0.47 },
  { id: 'C5', text: 'Memory lymphocytes persist after infection enabling rapid secondary responses.', score: 0.72 },
]

export const BI_DOCS = [
  { id: 'D1', vec: [0.8, 0.3, 0.1, 0.7, 0.5, 0.2], text: 'White blood cells destroy pathogens through phagocytosis.' },
  { id: 'D2', vec: [0.2, 0.9, 0.4, 0.1, 0.3, 0.8], text: 'The stock market rallied on positive earnings reports.' },
  { id: 'D3', vec: [0.7, 0.4, 0.2, 0.8, 0.6, 0.1], text: 'T-cells coordinate immune responses by releasing cytokines.' },
  { id: 'D4', vec: [0.3, 0.2, 0.7, 0.4, 0.8, 0.5], text: 'Python is widely used for machine learning projects.' },
  { id: 'D5', vec: [0.6, 0.5, 0.3, 0.6, 0.4, 0.3], text: 'Vaccines stimulate immune memory to prevent future infections.' },
]
export const QUERY_VEC = [0.75, 0.35, 0.15, 0.72, 0.55, 0.18]

export const COLBERT_DATA = {
  queryTokens: ['how', 'immune', 'fight', 'virus'],
  docs: [
    {
      id: 'D1', text: 'T-cells eliminate virus-infected cells via cytotoxic response.',
      tokens: ['T-cells', 'eliminate', 'virus', 'infected', 'cells', 'cytotoxic', 'response'],
      maxsims: [0.21, 0.68, 0.95, 0.72, 0.41, 0.31, 0.22],
    },
    {
      id: 'D2', text: 'The economy grew by 3% last quarter due to exports.',
      tokens: ['economy', 'grew', '3%', 'last', 'quarter', 'exports'],
      maxsims: [0.08, 0.11, 0.07, 0.14, 0.09, 0.06],
    },
    {
      id: 'D3', text: 'Antibodies bind viral surface proteins to neutralise infection.',
      tokens: ['Antibodies', 'bind', 'viral', 'surface', 'proteins', 'neutralise', 'infection'],
      maxsims: [0.19, 0.55, 0.88, 0.61, 0.42, 0.71, 0.66],
    },
  ],
}

export const HYBRID_DOCS = [
  { id: 'D1', text: 'White blood cells attack invading pathogens.', bm25Rank: 2, denseRank: 3 },
  { id: 'D2', text: 'T-cells and B-cells are key immune lymphocytes fighting viral infections.', bm25Rank: 1, denseRank: 2 },
  { id: 'D3', text: 'The immune system uses antibodies to neutralise viruses.', bm25Rank: 3, denseRank: 1 },
  { id: 'D4', text: 'Fever is a systemic immune response to infection.', bm25Rank: 5, denseRank: 4 },
  { id: 'D5', text: 'Stocks surged after the Federal Reserve policy announcement.', bm25Rank: 4, denseRank: 5 },
]

export function rrf(rank, k = 60) {
  return 1 / (k + rank)
}
