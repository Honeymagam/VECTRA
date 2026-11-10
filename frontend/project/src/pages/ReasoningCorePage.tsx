import { useState } from 'react';
import { useEffect } from 'react';
import {
  Brain,
  Database,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { api } from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface SemanticChunk {
  chunk_text: string;
  topic: string;
  similarity: number;
}

/* ─── Fallback demo data ─────────────────────────────────────────────────── */

const FALLBACK_CHUNKS: SemanticChunk[] = [
  {
    chunk_text:
      'Permutation is an arrangement of objects in a definite order. The number of permutations of n objects taken r at a time is given by P(n, r) = n! / (n − r)!. For example, the number of ways to arrange 3 letters from {A, B, C, D} is P(4,3) = 24.',
    topic: 'Permutations',
    similarity: 0.94,
  },
  {
    chunk_text:
      'Combination is a selection of items without regard to order. C(n, r) = n! / (r! × (n − r)!). Unlike permutations, the order of selection does not matter. Choosing 2 fruits from {apple, banana, cherry} gives C(3,2) = 3 combinations.',
    topic: 'Combinations',
    similarity: 0.87,
  },
  {
    chunk_text:
      'Probability of an event A is P(A) = (Number of favourable outcomes) / (Total number of outcomes). For mutually exclusive events, P(A ∪ B) = P(A) + P(B). For independent events, P(A ∩ B) = P(A) × P(B).',
    topic: 'Probability',
    similarity: 0.81,
  },
  {
    chunk_text:
      'Simple interest is calculated as SI = (P × R × T) / 100, where P is principal, R is the annual rate, and T is time in years. Compound interest is calculated as CI = P × (1 + R/100)^T − P, compounding annually.',
    topic: 'Interest',
    similarity: 0.76,
  },
];

/* ─── Pipeline step cards ────────────────────────────────────────────────── */

const PIPELINE_STEPS = [
  {
    step: '01',
    icon: Database,
    title: 'Retrieval',
    color: 'bg-primary-50 text-primary-600',
    ring: 'ring-primary-100',
    description:
      'Your question is converted into a high-dimensional embedding vector using a language model. This vector is then compared against all indexed knowledge chunks in the Supabase pgvector store using cosine similarity to find the most semantically relevant passages.',
    tags: ['pgvector', 'cosine similarity', 'embeddings'],
  },
  {
    step: '02',
    icon: Brain,
    title: 'Augmentation',
    color: 'bg-accent-50 text-accent-600',
    ring: 'ring-accent-100',
    description:
      "The top-K retrieved chunks are ranked by similarity score and injected into the LLM's context window alongside your original question. This grounds the model's response in your specific study material rather than relying solely on general pre-training knowledge.",
    tags: ['top-K ranking', 'context injection', 'grounding'],
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Generation',
    color: 'bg-success-50 text-success-600',
    ring: 'ring-success-100',
    description:
      'The augmented prompt is sent to the generative model which produces a step-by-step explanation, formula walkthrough, or solved example tailored to your query. Source references are extracted and returned alongside the answer for verification.',
    tags: ['LLM generation', 'source citation', 'chain-of-thought'],
  },
];

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'results'; chunks: SemanticChunk[]; query: string; usedFallback: boolean }
  | { kind: 'empty'; query: string };

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 85 ? 'bg-success-500' : pct >= 70 ? 'bg-primary-500' : 'bg-warning-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-navy-600">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ReasoningCorePage() {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({ kind: 'idle' });

  useEffect(() => {
    document.title = 'Cognitive Reasoning Core | VECTRA';
  }, []);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchState({ kind: 'loading' });

    try {
      const response = await api<{ results: Array<{ chunk: string; topic: string; similarity: number }> }>('/search', {
        method: 'POST', body: JSON.stringify({ query: trimmed, top_k: 5 }),
      });
      const chunks: SemanticChunk[] = response.results.map((item) => ({ chunk_text: item.chunk, topic: item.topic, similarity: item.similarity }));

      if (chunks.length === 0) {
        setSearchState({ kind: 'empty', query: trimmed });
      } else {
        setSearchState({ kind: 'results', chunks, query: trimmed, usedFallback: false });
      }
    } catch {
      // Fallback to demo data when RPC is unavailable
      setSearchState({ kind: 'results', chunks: FALLBACK_CHUNKS, query: trimmed, usedFallback: true });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void handleSearch();
  }

  const DEMO_QUERIES = [
    'How do permutations work?',
    'Explain probability addition rule',
    'What is compound interest?',
  ];

  return (
    <>
      <PageHeader
        eyebrow="Core Intelligence"
        title="Cognitive Reasoning Core"
        description="Understand how VECTRA's RAG pipeline retrieves, augments, and generates knowledge-grounded answers."
      />

      {/* Pipeline explanation */}
      <section aria-label="How it works" className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 animate-fade-in">
        {PIPELINE_STEPS.map(({ step, icon: Icon, title, color, ring, description, tags }) => (
          <article
            key={step}
            className={`relative rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card ring-1 ${ring} overflow-hidden`}
          >
            {/* Step number watermark */}
            <span className="absolute right-4 top-3 text-6xl font-black text-neutral-100 select-none">
              {step}
            </span>

            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            <h3 className="text-base font-semibold text-navy-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">{description}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-navy-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* Live demo */}
      <section
        aria-label="Live semantic search demo"
        className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card animate-fade-in"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Zap className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy-900">Live Retrieval Demo</h2>
            <p className="text-xs text-navy-400">Search indexed chunks with real semantic similarity scoring</p>
          </div>
        </div>

        {/* Search input */}
        <div className="mt-5 flex gap-3">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. How do permutations work?"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-navy-900 placeholder-navy-400 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              aria-label="Semantic search query"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searchState.kind === 'loading' || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Find relevant chunks
          </button>
        </div>

        {/* Demo query chips */}
        {searchState.kind === 'idle' && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-navy-400">Try:</span>
            {DEMO_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => { setQuery(q); }}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-navy-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* States */}
        {searchState.kind === 'loading' && (
          <div className="mt-6">
            <StatePanel variant="loading" title="Searching knowledge base" message="Computing embeddings and ranking chunks by similarity…" />
          </div>
        )}

        {searchState.kind === 'empty' && (
          <div className="mt-6">
            <StatePanel
              variant="empty"
              title="No matching chunks found"
              message={`No indexed content matched "${searchState.query}". Try adding more resources via Knowledge Extraction.`}
            />
          </div>
        )}

        {searchState.kind === 'results' && (
          <div className="mt-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-navy-700">
                {searchState.chunks.length} chunk{searchState.chunks.length !== 1 ? 's' : ''} retrieved
                for &ldquo;{searchState.query}&rdquo;
              </p>
              {searchState.usedFallback && (
                <span className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700">
                  Demo data (RPC unavailable)
                </span>
              )}
            </div>

            <ul className="space-y-3">
              {searchState.chunks.map((chunk, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-4 transition-colors hover:bg-white hover:shadow-card"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {i + 1}
                      </span>
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                        {chunk.topic}
                      </span>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-navy-500">
                      Similarity
                    </span>
                  </div>

                  <SimilarityBar score={chunk.similarity} />

                  <p className="mt-3 text-sm leading-relaxed text-navy-700 line-clamp-4">
                    {chunk.chunk_text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
