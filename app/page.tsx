'use client';

import { useState, useEffect, useCallback } from 'react';

interface Fundargerd {
  id: number; fund_numer: number; nefnd: string;
  dagsetning: string; titill: string;
  thatttakendur: string[]; source_url: string;
}
interface DagskrarLidur {
  numer: number; heiti: string; texti: string;
  akvardan: string | null; malsnumer: string | null;
}
interface FundargerdDetail extends Fundargerd { dagskrarlidur: DagskrarLidur[]; }
interface SearchResult { results: Fundargerd[]; total: number; page: number; pages: number; }
interface TimelineAtrid {
  malsnumer: string; dagsetning: string; nefnd: string; fund_numer: number;
  lidur_numer: number; lidur_heiti: string; akvardan: string | null;
  fundargerd_id: number; source_url: string;
}
interface MalTimeline { malsnumer: string; timeline: TimelineAtrid[]; fjoldi: number; }

function formatDate(iso: string, short = false): string {
  try {
    return new Date(iso).toLocaleDateString('is-IS', short
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function MalsnumerTag({ nr, onClick }: { nr: string; onClick: (nr: string) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(nr); }}
      title={`Sjá sögu máls ${nr}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        background: hover ? '#fff0b3' : '#fff8e6',
        border: '1px solid #e8c84a', borderRadius: 3,
        padding: '0.18rem 0.55rem', fontSize: '0.75rem',
        color: '#7a5c00', cursor: 'pointer',
        fontFamily: "'Georgia', serif", letterSpacing: '0.04em',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: '0.68rem' }}>📋</span>
      {nr}
      <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>↗</span>
    </button>
  );
}

function TimelineModal({ data, onClose, onOpen }: {
  data: MalTimeline; onClose: () => void; onOpen: (id: number) => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(10,20,50,0.55)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 6, maxWidth: 660, width: '100%',
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)', border: '1px solid #e0ddd5',
      }}>
        {/* Haus */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0ece4',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#c8a84b', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Málsnúmer · Saga máls
            </div>
            <div style={{ fontSize: '1.5rem', color: '#1a2744', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              {data.malsnumer}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.2rem', fontStyle: 'italic' }}>
              {data.fjoldi === 1 ? 'Kemur fyrir í 1 fundargerð' : `Kemur fyrir í ${data.fjoldi} fundargerðum`}
              {data.timeline.length > 1 && ` · Frá ${formatDate(data.timeline[0].dagsetning, true)} til ${formatDate(data.timeline[data.timeline.length - 1].dagsetning, true)}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>

        {/* Timeline */}
        <div style={{ padding: '1.5rem' }}>
          {data.timeline.length === 0
            ? <p style={{ color: '#999', fontStyle: 'italic' }}>Engar færslur fundnar.</p>
            : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 2, background: '#e8e4da' }} />

                {data.timeline.map((a, i) => {
                  const samþykkt = !!a.akvardan;
                  return (
                    <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
                      {/* Tímapunktur */}
                      <div style={{
                        flexShrink: 0, width: 24, height: 24, borderRadius: '50%', marginTop: 2,
                        background: samþykkt ? '#2d6e2d' : '#1a2744',
                        border: '3px solid #fff',
                        boxShadow: `0 0 0 2px ${samþykkt ? '#c3dfc3' : '#8a9cc0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                      }}>
                        <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold' }}>
                          {samþykkt ? '✓' : String(i + 1)}
                        </span>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a2744' }}>
                            {formatDate(a.dagsetning, true)}
                          </span>
                          {a.nefnd && (
                            <span style={{
                              fontSize: '0.7rem', background: '#f0f4ff', color: '#1a2744',
                              padding: '0.1rem 0.45rem', borderRadius: 2, letterSpacing: '0.04em',
                            }}>{a.nefnd}</span>
                          )}
                          {a.fund_numer && (
                            <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{a.fund_numer}. fundur</span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                          {a.lidur_numer ? `${a.lidur_numer}. ` : ''}{a.lidur_heiti}
                        </div>

                        {a.akvardan && (
                          <div style={{
                            fontSize: '0.8rem', color: '#2d6e2d', background: '#f0f7f0',
                            border: '1px solid #c3dfc3', borderRadius: 3,
                            padding: '0.3rem 0.65rem', marginBottom: '0.35rem', lineHeight: 1.5,
                          }}>
                            {a.akvardan}
                          </div>
                        )}

                        <button onClick={() => { onClose(); onOpen(a.fundargerd_id); }} style={{
                          background: 'none', border: 'none', padding: 0,
                          fontSize: '0.75rem', color: '#6688cc', cursor: 'pointer',
                          textDecoration: 'underline', fontFamily: 'inherit',
                        }}>
                          Opna fundargerð →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ── Aðalsíða ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [query, setQuery] = useState('');
  const [nefnd, setNefnd] = useState('');
  const [fra, setFra] = useState('');
  const [til, setTil] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [nefndir, setNefndir] = useState<{ nefnd: string; fjoldi: string }[]>([]);
  const [selected, setSelected] = useState<FundargerdDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [timeline, setTimeline] = useState<MalTimeline | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    fetch('/api/fundargerdir?nefndir=1').then(r => r.json()).then(d => setNefndir(d.nefndir)).catch(() => {});
  }, []);

  const search = useCallback(async (p = 1) => {
    setLoading(true); setSelected(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (nefnd) params.set('nefnd', nefnd);
      if (fra) params.set('fra', fra);
      if (til) params.set('til', til);
      params.set('page', String(p));
      setResults(await (await fetch(`/api/fundargerdir?${params}`)).json());
      setPage(p);
    } finally { setLoading(false); }
  }, [query, nefnd, fra, til]);

  useEffect(() => { search(1); }, []);

const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      setSelected(await (await fetch(`/api/fundargerdir?id=${id}`)).json());
    } finally { setDetailLoading(false); }
  };

  const openTimeline = async (malsnumer: string) => {
    setTimelineLoading(true); setTimeline(null);
    try {
      setTimeline(await (await fetch(`/api/mal?nr=${encodeURIComponent(malsnumer)}`)).json());
    } finally { setTimelineLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f2', fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Timeline modal */}
      {timelineLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,50,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '2rem 3rem', color: '#888', fontStyle: 'italic' }}>Sæki sögu máls...</div>
        </div>
      )}
      {timeline && !timelineLoading && (
        <TimelineModal data={timeline} onClose={() => setTimeline(null)} onOpen={openDetail} />
      )}

      {/* Header */}
      <header style={{ background: '#1a2744', padding: '2rem', borderBottom: '4px solid #c8a84b' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ color: '#c8a84b', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Reykjanesbær</div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '1.8rem', fontWeight: 400, letterSpacing: '-0.02em' }}>Fundargerðir</h1>
          <p style={{ color: '#8a9cc0', margin: '0.3rem 0 0', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Ráð, nefndir og bæjarstjórn — smelltu á <span style={{ color: '#c8a84b' }}>📋 málsnúmer</span> til að sjá sögu máls
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Leitarbox */}
        <div style={{ background: '#fff', borderRadius: 4, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e0ddd5' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <input type="text" placeholder="Leita í fundargerðum eða málsnúmerum..."
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search(1)}
              style={{ flex: '1 1 260px', padding: '0.65rem 1rem', fontSize: '1rem', border: '2px solid #ddd', borderRadius: 3, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => search(1)} disabled={loading} style={{ background: '#1a2744', color: '#fff', border: 'none', borderRadius: 3, padding: '0.65rem 1.5rem', fontSize: '0.95rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Leitar...' : 'Leita'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={nefnd} onChange={e => setNefnd(e.target.value)} style={{ padding: '0.45rem 0.75rem', border: '1px solid #ddd', borderRadius: 3, fontSize: '0.85rem', background: '#fafaf8', fontFamily: 'inherit', flex: '1 1 180px' }}>
              <option value="">Allar nefndir</option>
              {nefndir.map(n => <option key={n.nefnd} value={n.nefnd}>{n.nefnd} ({n.fjoldi})</option>)}
            </select>
            <input type="date" value={fra} onChange={e => setFra(e.target.value)} style={{ padding: '0.45rem 0.75rem', border: '1px solid #ddd', borderRadius: 3, fontSize: '0.85rem', background: '#fafaf8' }} />
            <span style={{ color: '#999', fontSize: '0.8rem' }}>–</span>
            <input type="date" value={til} onChange={e => setTil(e.target.value)} style={{ padding: '0.45rem 0.75rem', border: '1px solid #ddd', borderRadius: 3, fontSize: '0.85rem', background: '#fafaf8' }} />
            {(nefnd || fra || til) && <button onClick={() => { setNefnd(''); setFra(''); setTil(''); }} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 3, padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: '#666' }}>Hreinsa</button>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Listi */}
          <div style={{ flex: selected ? '0 0 360px' : '1', minWidth: 0 }}>
            {results && (
              <div style={{ marginBottom: '0.75rem', color: '#666', fontSize: '0.85rem' }}>
                {results.total} fundargerðir{results.pages > 1 && ` · Síða ${results.page} af ${results.pages}`}
              </div>
            )}
            {results?.results.map(fg => (
              <div key={fg.id} onClick={() => openDetail(fg.id)} style={{
                background: selected?.id === fg.id ? '#f0f4ff' : '#fff',
                border: `${selected?.id === fg.id ? 2 : 1}px solid ${selected?.id === fg.id ? '#1a2744' : '#e0ddd5'}`,
                borderRadius: 4, padding: '1rem 1.25rem', marginBottom: '0.6rem', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    {fg.nefnd && <div style={{ display: 'inline-block', background: '#f0f4ff', color: '#1a2744', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: 2, marginBottom: '0.4rem' }}>{fg.nefnd}</div>}
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a2744', marginBottom: '0.25rem' }}>
                      {fg.fund_numer ? `${fg.fund_numer}. fundur` : fg.titill}
                    </div>
                    {fg.thatttakendur?.length > 0 && (
                      <div style={{ fontSize: '0.78rem', color: '#888' }}>
                        {fg.thatttakendur.slice(0, 3).join(', ')}{fg.thatttakendur.length > 3 && ` +${fg.thatttakendur.length - 3}`}
                      </div>
                    )}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(fg.dagsetning)}</div>
                </div>
              </div>
            ))}
            {results && results.pages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                {page > 1 && <button onClick={() => search(page - 1)} style={{ padding: '0.4rem 1rem', border: '1px solid #ddd', borderRadius: 3, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>← Fyrri</button>}
                <span style={{ padding: '0.4rem 0.75rem', color: '#666', fontSize: '0.85rem' }}>{page} / {results.pages}</span>
                {page < results.pages && <button onClick={() => search(page + 1)} style={{ padding: '0.4rem 1rem', border: '1px solid #ddd', borderRadius: 3, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>Næsta →</button>}
              </div>
            )}
          </div>

          {/* Smáatriði */}
          {(selected || detailLoading) && (
            <div style={{ flex: 1, background: '#fff', border: '1px solid #e0ddd5', borderRadius: 4, padding: '1.5rem', position: 'sticky', top: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#c8a84b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{selected?.nefnd}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.2rem' }}>×</button>
              </div>

              {detailLoading ? (
                <div style={{ color: '#999', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Hleður...</div>
              ) : selected && (
                <>
                  <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#1a2744', fontWeight: 500 }}>
                    {selected.fund_numer ? `${selected.fund_numer}. fundur` : selected.titill}
                  </h2>
                  <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>{formatDate(selected.dagsetning)}</div>

                  {selected.thatttakendur?.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '0.35rem' }}>Þátttakendur</div>
                      <div style={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.7 }}>{selected.thatttakendur.join(', ')}</div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #f0ece4', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '0.75rem' }}>Dagskrá</div>
                    {selected.dagskrarlidur?.map((l, i) => (
                      <div key={i} style={{ marginBottom: '1rem', paddingLeft: '0.75rem', borderLeft: '2px solid #e8e4da' }}>
                        {/* Titill + málsnúmer */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a2744', lineHeight: 1.4 }}>
                            {l.numer ? `${l.numer}. ` : ''}{l.heiti}
                          </span>
                          {l.malsnumer && (
                            <MalsnumerTag nr={l.malsnumer} onClick={openTimeline} />
                          )}
                        </div>
                        {l.texti && (
                          <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{l.texti}</div>
                        )}
                        {l.akvardan && (
                          <div style={{ marginTop: '0.4rem', background: '#f0f7f0', border: '1px solid #c3dfc3', borderRadius: 3, padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: '#2d6e2d' }}>
                            ✓ {l.akvardan}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selected.source_url && (
                    <a href={selected.source_url} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.82rem', color: '#1a2744', opacity: 0.6 }}>
                      Upprunaleg fundargerð ↗
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
