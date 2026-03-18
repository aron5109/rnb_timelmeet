import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { TimelineData, TimelineEvent } from '../lib/types';

// ── Reykjanesbær brand colours (from 2025 design standard) ──────────────────
const BRAND = {
  blue:      '#003865',
  blueLight: '#0057A8',
  blueUltra: '#E8F0F8',
  white:     '#FFFFFF',
  offwhite:  '#F7F5F0',
  gold:      '#C8A951',
  red:       '#C0392B',
  darkText:  '#1A1A2E',
  grey:      '#6B7280',
  greyLight: '#E5E7EB',
};

const CATEGORY_COLORS: Record<string, string> = {
  'contract':      BRAND.blue,
  'financial':     BRAND.gold,
  'regulatory':    '#2f7c58',
  'communication': '#3a6fa0',
  'legal-action':  BRAND.red,
  'administrative':'#526074',
  'investigation': '#c4652a',
};

const CATEGORY_LABELS: Record<string, string> = {
  'contract':       'Samningur',
  'financial':      'Fjármál',
  'regulatory':     'Reglugerðir',
  'communication':  'Samskipti',
  'legal-action':   'Réttaraðgerð',
  'administrative': 'Stjórnsýsla',
  'investigation':  'Rannsókn',
};

// ── Logo SVG (Reykjanesbær shield shape) ────────────────────────────────────
function RNBLogo({ white = false, size = 48 }: { white?: boolean; size?: number }) {
  const c = white ? '#FFFFFF' : BRAND.blue;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 5 L90 20 L90 55 Q90 78 50 95 Q10 78 10 55 L10 20 Z"
            fill={c} opacity={white ? 1 : 1} />
      <path d="M50 18 L77 29 L77 54 Q77 71 50 83 Q23 71 23 54 L23 29 Z"
            fill={white ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'} />
      <text x="50" y="58" textAnchor="middle" fontSize="28" fontWeight="bold"
            fontFamily="Georgia, serif" fill={white ? BRAND.blue : '#FFFFFF'}>RB</text>
    </svg>
  );
}

// ── Evidence badge ───────────────────────────────────────────────────────────
function EvidenceBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    fact: 'Staðreynd', allegation: 'Ásökun',
    assertion: 'Fullyrðing', inference: 'Ályktun',
  };
  const colors: Record<string, string> = {
    fact: BRAND.blue, allegation: BRAND.red,
    assertion: '#526074', inference: BRAND.gold,
  };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
      background: colors[type] || BRAND.grey, color: '#fff',
    }}>
      {labels[type] || type}
    </span>
  );
}

// ── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, isActive, onSelect }:
  { event: TimelineEvent; isActive: boolean; onSelect: () => void }) {
  const catColor = CATEGORY_COLORS[event.category] || BRAND.grey;
  return (
    <div
      id={`card-${event.id}`}
      onClick={onSelect}
      style={{
        background: BRAND.white,
        borderRadius: 12,
        padding: '18px 22px',
        marginBottom: 14,
        cursor: 'pointer',
        borderLeft: `4px solid ${catColor}`,
        boxShadow: isActive
          ? `0 0 0 2px ${BRAND.blue}, 0 4px 20px rgba(0,56,101,0.15)`
          : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, transform 0.15s',
        transform: isActive ? 'translateX(4px)' : 'none',
      }}
    >
      {/* Date + badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: BRAND.grey, fontFamily: 'Georgia, serif' }}>
          {formatDate(event.date)}
        </span>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 20,
          background: catColor + '18', color: catColor, fontWeight: 600,
        }}>
          {CATEGORY_LABELS[event.category] || event.category}
        </span>
        <EvidenceBadge type={event.evidence_type} />
        {event.meeting_number && (
          <span style={{ fontSize: 10, color: BRAND.grey }}>Fundur {event.meeting_number}</span>
        )}
      </div>

      {/* Title */}
      <h3 style={{
        margin: '0 0 8px', fontSize: 15, fontWeight: 700,
        fontFamily: 'Georgia, serif', color: BRAND.darkText, lineHeight: 1.35,
      }}>
        {event.title}
      </h3>

      {/* Summary */}
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#444', lineHeight: 1.55 }}>
        {event.summary}
      </p>

      {/* People tags */}
      {event.people && event.people.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {event.people.map(p => (
            <span key={p} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 12,
              background: BRAND.blueUltra, color: BRAND.blue, fontWeight: 500,
            }}>
              👤 {p}
            </span>
          ))}
        </div>
      )}

      {/* Issue tags */}
      {event.issues && event.issues.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {event.issues.map(i => (
            <span key={i} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 12,
              background: '#FFF3CD', color: '#856404', fontWeight: 500,
            }}>
              {i}
            </span>
          ))}
        </div>
      )}

      {/* Vote + Source */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', gap: 4 }}>
        {event.vote && (
          <span style={{ fontSize: 11, color: '#2f7c58', fontWeight: 600 }}>
            🗳 {event.vote}
          </span>
        )}
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, color: BRAND.blueLight, textDecoration: 'underline' }}
        >
          {event.source}
        </a>
      </div>
    </div>
  );
}

// ── Timeline Rail ────────────────────────────────────────────────────────────
function TimelineRail({ events, activeId, onDotClick }:
  { events: TimelineEvent[]; activeId: string | null; onDotClick: (id: string) => void }) {
  const byYear: Record<string, TimelineEvent[]> = {};
  events.forEach(e => {
    const y = e.date.substring(0, 4) || 'Óþekkt';
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(e);
  });

  return (
    <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 90, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 14, top: 0, bottom: 0,
          width: 2, background: `linear-gradient(to bottom, ${BRAND.blue}, ${BRAND.blueLight}40)`,
        }} />

        {Object.entries(byYear).sort(([a], [b]) => b.localeCompare(a)).map(([year, evts]) => (
          <div key={year}>
            {/* Year marker */}
            <div style={{
              position: 'relative', marginBottom: 6, marginTop: 14,
              fontSize: 11, fontWeight: 800, color: BRAND.blue,
              fontFamily: 'Georgia, serif', letterSpacing: '0.08em',
            }}>
              <div style={{
                position: 'absolute', left: -22, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 2, background: BRAND.blue,
              }} />
              {year}
            </div>

            {evts.map(e => {
              const catColor = CATEGORY_COLORS[e.category] || BRAND.grey;
              const isActive = e.id === activeId;
              return (
                <div
                  key={e.id}
                  onClick={() => onDotClick(e.id)}
                  title={e.title}
                  style={{
                    position: 'relative', marginBottom: 4, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -22,
                    width: 12, height: 12, borderRadius: '50%',
                    background: isActive ? catColor : BRAND.white,
                    border: `2px solid ${catColor}`,
                    boxShadow: isActive ? `0 0 0 3px ${catColor}30` : 'none',
                    transition: 'all 0.2s',
                    zIndex: 1,
                  }} />
                  {/* Label */}
                  <span style={{
                    fontSize: 11, color: isActive ? BRAND.darkText : BRAND.grey,
                    fontWeight: isActive ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', maxWidth: 170,
                    transition: 'color 0.2s',
                  }}>
                    {e.title}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Filter chip ──────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
        fontSize: 12, fontWeight: 600, border: 'none', transition: 'all 0.15s',
        background: active ? BRAND.blue : BRAND.greyLight,
        color: active ? BRAND.white : BRAND.darkText,
      }}
    >
      {label}
    </button>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  if (!iso) return '';
  const months = ['jan.','feb.','mar.','apr.','maí','jún.','júl.','ágú.','sep.','okt.','nóv.','des.'];
  const [y, m, d] = iso.split('-');
  if (!y) return iso;
  const mi = parseInt(m) - 1;
  if (!m) return y;
  if (!d) return `${months[mi] || m} ${y}`;
  return `${parseInt(d)}. ${months[mi] || m} ${y}`;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadCount, setLoadCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterIssues, setFilterIssues] = useState<string[]>([]);
  const [filterPeople, setFilterPeople] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const suppressObserver = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadTimeline = useCallback(async (count: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/timeline?limit=${count}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Villa við að hlaða');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter logic
  const filteredEvents = (data?.events || []).filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.people.some(p => p.toLowerCase().includes(q)) ||
        e.issues.some(i => i.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterCategories.length && !filterCategories.includes(e.category)) return false;
    if (filterIssues.length && !e.issues.some(i => filterIssues.includes(i))) return false;
    if (filterPeople.length && !e.people.some(p => filterPeople.includes(p))) return false;
    return true;
  });

  const allCategories = Array.from(new Set(data?.events.map(e => e.category) || []));
  const allIssues = Array.from(new Set(data?.events.flatMap(e => e.issues) || [])).slice(0, 20);
  const allPeople = Array.from(new Set(data?.events.flatMap(e => e.people) || [])).slice(0, 20);

  const toggleCategory = (c: string) =>
    setFilterCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleIssue = (i: string) =>
    setFilterIssues(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const togglePerson = (p: string) =>
    setFilterPeople(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleDotClick = (id: string) => {
    setActiveId(id);
    suppressObserver.current = true;
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { suppressObserver.current = false; }, 800);
  };

  // IntersectionObserver for scroll sync
  useEffect(() => {
    if (!filteredEvents.length) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return;
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.sort((a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top)[0];
          const id = top.target.id.replace('card-', '');
          setActiveId(id);
        }
      },
      { threshold: 0.4 }
    );
    filteredEvents.forEach(e => {
      const el = document.getElementById(`card-${e.id}`);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [filteredEvents]);

  const activeCount = filterCategories.length + filterIssues.length + filterPeople.length + (searchQuery ? 1 : 0);

  return (
    <>
      <Head>
        <title>Tímalína – Bæjarstjórn Reykjanesbæjar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Gagnvirkur yfirlit yfir fundargerðir bæjarstjórnar Reykjanesbæjar" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BRAND.offwhite}; font-family: 'Segoe UI', system-ui, sans-serif; color: ${BRAND.darkText}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.blueLight}50; border-radius: 3px; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .card-area { display: block !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: BRAND.blue,
        color: BRAND.white,
        padding: '0 32px',
        boxShadow: '0 2px 12px rgba(0,56,101,0.25)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0',
        }}>
          {/* Logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <RNBLogo white size={44} />
            <div>
              <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Reykjanesbær
              </div>
              <div style={{
                fontSize: 18, fontWeight: 700, fontFamily: "'Source Serif 4', Georgia, serif",
                letterSpacing: '-0.01em',
              }}>
                Tímalína Bæjarstjórnar
              </div>
            </div>
          </div>

          {/* Stats */}
          {data && (
            <div style={{ display: 'flex', gap: 24, opacity: 0.9 }} className="no-print">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {data.metadata.event_count}
                </div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Atburðir</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {data.metadata.documents_processed}
                </div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Fundargerðir</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {data.metadata.period}
                </div>
                <div style={{ fontSize: 10, opacity: 0.75 }}>Tímabil</div>
              </div>
            </div>
          )}
        </div>

        {/* Blue accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.blueLight}, ${BRAND.gold})`, margin: '0 -32px' }} />
      </header>

      {/* ── Search + Filter bar ── */}
      <div style={{
        background: BRAND.white, borderBottom: `1px solid ${BRAND.greyLight}`,
        padding: '10px 32px', position: 'sticky', top: 72, zIndex: 90,
      }} className="no-print">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: BRAND.grey, fontSize: 14 }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Leita í fundargerðum..."
                style={{
                  width: '100%', padding: '8px 12px 8px 34px',
                  border: `1px solid ${BRAND.greyLight}`, borderRadius: 8,
                  fontSize: 13, outline: 'none', background: BRAND.offwhite,
                  color: BRAND.darkText,
                }}
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen(v => !v)}
              style={{
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${filtersOpen ? BRAND.blue : BRAND.greyLight}`,
                background: filtersOpen ? BRAND.blueUltra : BRAND.white,
                color: filtersOpen ? BRAND.blue : BRAND.darkText,
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Síur {activeCount > 0 ? `(${activeCount})` : ''} {filtersOpen ? '▲' : '▼'}
            </button>

            {/* Clear filters */}
            {activeCount > 0 && (
              <button
                onClick={() => { setFilterCategories([]); setFilterIssues([]); setFilterPeople([]); setSearchQuery(''); }}
                style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${BRAND.red}`, background: 'white',
                  color: BRAND.red, fontSize: 13, fontWeight: 600,
                }}
              >
                Hreinsa síur
              </button>
            )}

            {/* Print */}
            <button
              onClick={() => window.print()}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${BRAND.greyLight}`, background: 'white',
                color: BRAND.grey, fontSize: 13,
              }}
            >
              🖨 Prenta
            </button>
          </div>

          {/* Collapsible filter panel */}
          {filtersOpen && (
            <div style={{
              marginTop: 10, padding: '14px', background: BRAND.offwhite,
              borderRadius: 8, border: `1px solid ${BRAND.greyLight}`,
            }}>
              {/* Categories */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.grey, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Flokkur
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allCategories.map(c => (
                    <Chip key={c} label={CATEGORY_LABELS[c] || c}
                      active={filterCategories.includes(c)} onClick={() => toggleCategory(c)} />
                  ))}
                </div>
              </div>

              {/* Issues */}
              {allIssues.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.grey, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Málefni
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {allIssues.map(i => (
                      <Chip key={i} label={i} active={filterIssues.includes(i)} onClick={() => toggleIssue(i)} />
                    ))}
                  </div>
                </div>
              )}

              {/* People */}
              {allPeople.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.grey, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Bæjarfulltrúar
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {allPeople.map(p => (
                      <Chip key={p} label={p} active={filterPeople.includes(p)} onClick={() => togglePerson(p)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>

        {/* Loading state */}
        {!data && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <RNBLogo size={80} />
            <h1 style={{
              marginTop: 24, fontSize: 28, fontFamily: "'Source Serif 4', Georgia, serif",
              color: BRAND.blue, fontWeight: 700,
            }}>
              Tímalína Bæjarstjórnar Reykjanesbæjar
            </h1>
            <p style={{ marginTop: 12, color: BRAND.grey, fontSize: 15, maxWidth: 480, margin: '12px auto 32px' }}>
              Sjálfvirk greining á fundargerðum bæjarstjórnar með gervigreind.
              Veldu hversu margar fundargerðir á að greina.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => { setLoadCount(n); loadTimeline(n); }} style={{
                  padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
                  background: n === 10 ? BRAND.blue : BRAND.white,
                  color: n === 10 ? BRAND.white : BRAND.blue,
                  border: `2px solid ${BRAND.blue}`,
                  fontSize: 15, fontWeight: 700, transition: 'all 0.15s',
                }}>
                  {n} fundargerðir
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: 48, height: 48, border: `4px solid ${BRAND.blueUltra}`,
              borderTop: `4px solid ${BRAND.blue}`, borderRadius: '50%',
              margin: '0 auto 20px', animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: BRAND.blue, fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16 }}>
              Greini fundargerðir með gervigreind…
            </p>
            <p style={{ color: BRAND.grey, fontSize: 13, marginTop: 8 }}>
              Þetta tekur 30–60 sekúndur
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: `1px solid ${BRAND.red}20`,
            borderRadius: 10, padding: 24, textAlign: 'center', color: BRAND.red,
          }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Villa kom upp</p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>{error}</p>
            <button onClick={() => loadTimeline(loadCount)} style={{
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              background: BRAND.red, color: 'white', border: 'none', fontWeight: 600,
            }}>
              Reyna aftur
            </button>
          </div>
        )}

        {/* ── Timeline content ── */}
        {data && (
          <>
            {/* Case summary */}
            <div style={{
              background: BRAND.blue, color: BRAND.white,
              borderRadius: 12, padding: '24px 28px', marginBottom: 24,
              backgroundImage: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.blueLight} 100%)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <RNBLogo white size={40} />
                <div>
                  <h2 style={{ fontSize: 16, fontFamily: "'Source Serif 4', Georgia, serif", marginBottom: 8, opacity: 0.9 }}>
                    Yfirlit
                  </h2>
                  <p style={{ fontSize: 14, lineHeight: 1.65, opacity: 0.88, maxWidth: 800 }}>
                    {data.metadata.summary}
                  </p>
                </div>
              </div>
              {/* Issue tags */}
              {data.metadata.issues && data.metadata.issues.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.metadata.issues.slice(0, 10).map(issue => (
                    <span key={issue} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 500,
                    }}>
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Active filter tags display */}
            {activeCount > 0 && (
              <div style={{ marginBottom: 14, fontSize: 12, color: BRAND.grey }}>
                Sýni {filteredEvents.length} af {data.events.length} atburðum
              </div>
            )}

            {/* Main 2-column layout */}
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              {/* Timeline rail */}
              <div className="no-print">
                <TimelineRail
                  events={filteredEvents}
                  activeId={activeId}
                  onDotClick={handleDotClick}
                />
              </div>

              {/* Cards */}
              <div style={{ flex: 1, minWidth: 0 }} className="card-area">
                {filteredEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: BRAND.grey }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                    <p style={{ fontSize: 16 }}>Engir atburðir fundust</p>
                    <button
                      onClick={() => { setFilterCategories([]); setFilterIssues([]); setFilterPeople([]); setSearchQuery(''); }}
                      style={{
                        marginTop: 16, padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
                        background: BRAND.blue, color: 'white', border: 'none', fontSize: 13,
                      }}
                    >
                      Hreinsa síur
                    </button>
                  </div>
                ) : (
                  filteredEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isActive={event.id === activeId}
                      onSelect={() => setActiveId(event.id)}
                    />
                  ))
                )}

                {/* Obligations */}
                {data.obligations && data.obligations.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h2 style={{
                      fontSize: 17, fontFamily: "'Source Serif 4', Georgia, serif",
                      color: BRAND.blue, marginBottom: 14, paddingBottom: 8,
                      borderBottom: `2px solid ${BRAND.blue}20`,
                    }}>
                      Skuldbindingar
                    </h2>
                    {data.obligations.map(obl => (
                      <div key={obl.id} style={{
                        background: BRAND.white, borderRadius: 10, padding: '14px 18px',
                        marginBottom: 10, borderLeft: `4px solid ${
                          obl.status === 'met' ? '#2f7c58' :
                          obl.status === 'missed' ? BRAND.red : BRAND.gold}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{obl.title}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600,
                            background: obl.status === 'met' ? '#DCFCE7' : obl.status === 'missed' ? '#FEE2E2' : '#FEF9C3',
                            color: obl.status === 'met' ? '#166534' : obl.status === 'missed' ? '#991B1B' : '#854D0E',
                          }}>
                            {obl.status === 'met' ? 'Uppfyllt' : obl.status === 'missed' ? 'Vanrækt' : 'Óþekkt'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: BRAND.grey, marginTop: 4 }}>
                          {obl.required_of} — {obl.required_by}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load more / reload buttons */}
                <div style={{ marginTop: 32, display: 'flex', gap: 10, justifyContent: 'center' }} className="no-print">
                  <a
                    href="https://www.reykjanesbaer.is/is/stjornsysla/stjornsyslan/fundargerdir/baejarstjorn"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 22px', borderRadius: 8, textDecoration: 'none',
                      border: `1px solid ${BRAND.blue}`, color: BRAND.blue,
                      fontSize: 13, fontWeight: 600,
                    }}
                  >
                    Sjá allar fundargerðir →
                  </a>
                  <button onClick={() => loadTimeline(loadCount)} style={{
                    padding: '10px 22px', borderRadius: 8, cursor: 'pointer',
                    background: BRAND.blue, color: 'white', border: 'none',
                    fontSize: 13, fontWeight: 600,
                  }}>
                    Uppfæra gögn
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        marginTop: 60, background: BRAND.blue, color: 'rgba(255,255,255,0.7)',
        padding: '24px 32px', textAlign: 'center', fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <RNBLogo white size={28} />
          <span style={{ color: 'white', fontWeight: 600 }}>Reykjanesbær</span>
        </div>
        <p>Tímalína bæjarstjórnar — gervigreindargreining á opinberum fundargerðum</p>
        <p style={{ marginTop: 4 }}>
          Upprunaleg gögn: <a href="https://www.reykjanesbaer.is" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.85)' }}>reykjanesbaer.is</a>
        </p>
      </footer>
    </>
  );
}
