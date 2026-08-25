/**
 * Sample corpora the app loads with. Kept as plain data in its own module so
 * the build scripts under `scripts/` can import it without pulling in React.
 */
export const PRESETS = [
  {
    id: 'immunology',
    label: 'Immunology',
    document:
      "The immune system is the body's defense against disease. It identifies pathogens such as bacteria and viruses. White blood cells called lymphocytes are central to this response. T-cells destroy infected cells directly. B-cells produce antibodies that neutralise threats. Memory cells allow faster responses to repeat infections. Vaccines train this system using weakened pathogens. Autoimmune diseases occur when the system attacks healthy tissue. Inflammation is an early warning signal of immune activation. The complement system enhances antibody effects on pathogens.",
    query: 'How does the immune system fight viruses?',
    docs: [
      { id: 'D1', text: 'White blood cells destroy pathogens through phagocytosis.' },
      { id: 'D2', text: 'T-cells and B-cells are key immune lymphocytes fighting viral infections.' },
      { id: 'D3', text: 'The immune system uses antibodies to neutralise viruses.' },
      { id: 'D4', text: 'Fever is a systemic immune response to infection.' },
      { id: 'D5', text: 'Stocks surged after the Federal Reserve policy announcement.' },
      { id: 'D6', text: 'Python is widely used for machine learning projects.' },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    document:
      'A database index speeds up reads by storing a sorted copy of selected columns. B-tree indexes support range scans and equality lookups. Hash indexes answer equality lookups in constant time but cannot serve ranges. Every index must be updated on write, so indexes trade write throughput for read latency. A covering index answers a query entirely from the index without touching the table. Query planners use table statistics to choose between a sequential scan and an index scan. Stale statistics are a common cause of sudden plan regressions. Partial indexes cover only the rows matching a predicate, keeping them small.',
    query: 'Why would the planner ignore my index?',
    docs: [
      { id: 'D1', text: 'The query planner picks a sequential scan when it estimates most rows will match.' },
      { id: 'D2', text: 'Stale table statistics cause the planner to misestimate selectivity and skip indexes.' },
      { id: 'D3', text: 'A B-tree index supports both equality lookups and ordered range scans.' },
      { id: 'D4', text: 'Indexes slow down writes because every insert must update every index.' },
      { id: 'D5', text: 'Vacuum reclaims dead tuples left behind by updates and deletes.' },
      { id: 'D6', text: 'The restaurant serves breakfast until eleven on weekends.' },
    ],
  },
  {
    id: 'climate',
    label: 'Climate',
    document:
      'Greenhouse gases trap outgoing infrared radiation in the atmosphere. Carbon dioxide is the most significant long-lived greenhouse gas. Methane traps far more heat per molecule but breaks down within decades. The oceans have absorbed most of the excess heat so far. Warmer oceans expand, which drives a large share of sea level rise. Melting land ice adds further water to the oceans. Feedback loops such as albedo loss can accelerate warming. Emissions cuts today still take decades to show up in surface temperature.',
    query: 'What makes sea levels rise?',
    docs: [
      { id: 'D1', text: 'Thermal expansion of warming seawater accounts for much of observed sea level rise.' },
      { id: 'D2', text: 'Melting glaciers and ice sheets add freshwater volume to the oceans.' },
      { id: 'D3', text: 'Carbon dioxide persists in the atmosphere for centuries after it is emitted.' },
      { id: 'D4', text: 'Methane is a potent but comparatively short-lived greenhouse gas.' },
      { id: 'D5', text: 'Albedo loss from vanishing sea ice is a reinforcing feedback loop.' },
      { id: 'D6', text: 'The quarterly earnings call has been moved to Thursday morning.' },
    ],
  },
]

export const DEFAULT_PRESET = PRESETS[0]
