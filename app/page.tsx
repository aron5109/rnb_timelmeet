'use client';

import { useState, useEffect, useCallback } from 'react';

interface Fundargerd {
  id: number; fund_numer: number; nefnd: string;
  dagsetning: string; titill: string;
  thatttakendur: string[]; source_url: string;
  vidstaddir_texti?: string;
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
interface PersonFundir { nafn: string; fundir: Fundargerd[]; fjoldi: number; }

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:      '#0f1e3d',
  navyMid:   '#1a2f5e',
  navyLight: '#253d6e',
  gold:      '#c4923a',
  goldLight: '#e8b96a',
  goldPale:  '#fdf6e8',
  white:     '#ffffff',
  bg:        '#f4f5f7',
  surface:   '#ffffff',
  border:    '#e2e5ec',
  borderHov: '#c4923a',
  text:      '#111827',
  textSub:   '#4b5563',
  textMuted: '#9ca3af',
  green:     '#16803c',
  greenPale: '#f0fdf4',
  greenBord: '#bbf7d0',
  bluePale:  '#eff6ff',
  blueBord:  '#bfdbfe',
  blueText:  '#1d4ed8',
};

const IS_MONTHS_LONG  = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];
const IS_MONTHS_SHORT = ['jan.','feb.','mar.','apr.','maí','jún.','júl.','ágú.','sep.','okt.','nóv.','des.'];

function formatDate(iso: string, short = false): string {
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const month = short ? IS_MONTHS_SHORT[d.getMonth()] : IS_MONTHS_LONG[d.getMonth()];
    const year = d.getFullYear();
    return `${day}. ${month} ${year}`;
  } catch { return iso; }
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
function IconExternalLink({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function IconDoc({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function IconCheck({ size = 10, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconClose({ size = 18, color = C.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconSearch({ size = 18, color = C.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconCalendar({ size = 14, color = C.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconUsers({ size = 14, color = C.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Attendee parsing ────────────────────────────────────────────────────────────
interface ParsedAttendees {
  nefndarmenn: string[];
  forseti: string | null;
  starfsmenn: string;
  raw: string;
}

function parseAttendeesFromText(text: string): ParsedAttendees | null {
  if (!text) return null;

  const result: ParsedAttendees = { nefndarmenn: [], forseti: null, starfsmenn: '', raw: text };

  // Extract "Viðstaddir:" line names + "Í forsæti var [name]."
  const vidstaddirMatch = text.match(/Viðstaddir:\s*([\s\S]*?)(?=Að auki|$)/i);
  if (!vidstaddirMatch) return null;

  const vidstaddirBlock = vidstaddirMatch[1].trim();

  // Extract "Í forsæti var [name]."
  const forsetiMatch = vidstaddirBlock.match(/Í forsæti var\s+([^.]+)\./i);
  if (forsetiMatch) {
    result.forseti = forsetiMatch[1].trim();
  }

  // Get names before "Í forsæti"
  const namesBlock = vidstaddirBlock.split(/Í forsæti/i)[0].trim();
  // Split on commas and "og"
  const names = namesBlock
    .replace(/\s+og\s+/g, ', ')
    .split(',')
    .map(n => n.trim().replace(/\.$/, ''))
    .filter(n => n.length > 2);
  result.nefndarmenn = names;

  // Extract "Að auki sátu fundinn..." section
  const adAukiMatch = text.match(/Að auki sátu fundinn\s*([\s\S]*)/i);
  if (adAukiMatch) {
    result.starfsmenn = adAukiMatch[1].trim();
  }

  return result;
}

function extractNamesFromText(text: string): string[] {
  // Extract individual names from a text block (staff + forföll section)
  // Names are typically: "Firstname Lastname title, Firstname Lastname title"
  // or "Firstname Lastname boðaði forföll"
  const names: string[] = [];
  // Match Icelandic name patterns (capitalized words followed by lowercase)
  const namePattern = /([A-ZÁÉÍÓÚÝÞÆÖÐ][a-záéíóúýþæöð]+(?:\s+[A-ZÁÉÍÓÚÝÞÆÖÐ][a-záéíóúýþæöð]+)+)/g;
  let m;
  while ((m = namePattern.exec(text)) !== null) {
    const candidate = m[1].trim();
    // Filter out common non-name phrases
    if (!candidate.match(/^(Að auki|Í forsæti|sat fundinn|sat fyrir|boðaði forföll)/i)) {
      names.push(candidate);
    }
  }
  return names;
}

// ── MalsnumerTag ────────────────────────────────────────────────────────────────
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
        background: hover ? C.goldPale : '#fffbf0',
        border: `1px solid ${hover ? C.gold : '#e8c87a'}`,
        borderRadius: 20, padding: '0.15rem 0.55rem 0.15rem 0.4rem',
        fontSize: '0.72rem', color: '#92650a', cursor: 'pointer',
        letterSpacing: '0.03em', transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <IconDoc size={11} color="#c4923a" />
      <span style={{ fontWeight: 600 }}>{nr}</span>
      <IconExternalLink size={10} color="#c4923a" />
    </button>
  );
}

// ── Timeline Modal ─────────────────────────────────────────────────────────────
function TimelineModal({ data, onClose, onOpen }: {
  data: MalTimeline; onClose: () => void; onOpen: (id: number) => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,18,40,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, borderRadius: 12, maxWidth: 680, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `1px solid ${C.border}`,
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem 1.25rem',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: C.surface, zIndex: 1,
          borderRadius: '12px 12px 0 0',
        }}>
          <div>
            <div style={{
              fontSize: '0.65rem', color: C.gold, letterSpacing: '0.16em',
              textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600,
            }}>
              Málsnúmer · Saga máls
            </div>
            <div style={{
              fontSize: '1.6rem', color: C.navy, fontWeight: 700,
              letterSpacing: '0.04em', fontFamily: 'monospace',
            }}>
              {data.malsnumer}
            </div>
            <div style={{
              fontSize: '0.82rem', color: C.textMuted, marginTop: '0.3rem',
            }}>
              {data.fjoldi === 1 ? 'Kemur fyrir í 1 fundargerð' : `Kemur fyrir í ${data.fjoldi} fundargerðum`}
              {data.timeline.length > 1 && (
                <span style={{ color: C.textSub }}>
                  {' · '}Frá {formatDate(data.timeline[0].dagsetning, true)} til {formatDate(data.timeline[data.timeline.length - 1].dagsetning, true)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: C.bg, border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, marginLeft: '1rem', transition: 'background 0.15s',
          }}>
            <IconClose size={16} color={C.textSub} />
          </button>
        </div>

        {/* Timeline entries */}
        <div style={{ padding: '1.75rem' }}>
          {data.timeline.length === 0
            ? <p style={{ color: C.textMuted, fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>Engar færslur fundnar.</p>
            : (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 13, top: 18, bottom: 18,
                  width: 2, background: `linear-gradient(to bottom, ${C.navy}33, ${C.navy}11)`,
                  borderRadius: 2,
                }} />

                {data.timeline.map((a, i) => {
                  const samþykkt = !!a.akvardan;
                  return (
                    <div key={i} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.75rem', position: 'relative' }}>
                      <div style={{
                        flexShrink: 0, width: 28, height: 28, borderRadius: '50%', marginTop: 0,
                        background: samþykkt ? C.green : C.navy,
                        border: `3px solid ${C.surface}`,
                        boxShadow: `0 0 0 2px ${samþykkt ? C.greenBord : '#93c5fd'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                      }}>
                        {samþykkt
                          ? <IconCheck size={11} />
                          : <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>{i + 1}</span>
                        }
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex', gap: '0.5rem', alignItems: 'center',
                          flexWrap: 'wrap', marginBottom: '0.4rem',
                        }}>
                          <span style={{
                            fontSize: '0.82rem', fontWeight: 700, color: C.text,
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}>
                            <IconCalendar size={13} color={C.gold} />
                            {formatDate(a.dagsetning, true)}
                          </span>
                          {a.nefnd && (
                            <span style={{
                              fontSize: '0.68rem', background: C.bluePale, color: C.blueText,
                              padding: '0.12rem 0.5rem', borderRadius: 20,
                              fontWeight: 600, letterSpacing: '0.04em',
                            }}>{a.nefnd}</span>
                          )}
                          {a.fund_numer && (
                            <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
                              {a.fund_numer}. fundur
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontSize: '0.9rem', color: C.textSub, lineHeight: 1.55,
                          marginBottom: '0.4rem',
                        }}>
                          {a.lidur_numer ? `${a.lidur_numer}. ` : ''}{a.lidur_heiti}
                        </div>

                        {a.akvardan && (
                          <div style={{
                            fontSize: '0.8rem', color: C.green,
                            background: C.greenPale, border: `1px solid ${C.greenBord}`,
                            borderRadius: 6, padding: '0.4rem 0.75rem',
                            marginBottom: '0.4rem', lineHeight: 1.5,
                            display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
                          }}>
                            <IconCheck size={12} color={C.green} />
                            <span>{a.akvardan}</span>
                          </div>
                        )}

                        <button onClick={() => { onClose(); onOpen(a.fundargerd_id); }} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          background: 'none', border: 'none', padding: 0,
                          fontSize: '0.75rem', color: C.blueText, cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'opacity 0.15s',
                        }}>
                          Opna fundargerð
                          <IconExternalLink size={11} color={C.blueText} />
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

// ── Person Modal ──────────────────────────────────────────────────────────────
function PersonModal({ data, onClose, onOpen }: {
  data: PersonFundir; onClose: () => void; onOpen: (id: number) => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,18,40,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, borderRadius: 12, maxWidth: 680, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `1px solid ${C.border}`,
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem 1.25rem',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: C.surface, zIndex: 1,
          borderRadius: '12px 12px 0 0',
        }}>
          <div>
            <div style={{
              fontSize: '0.65rem', color: C.gold, letterSpacing: '0.16em',
              textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600,
            }}>
              Þátttakandi · Fundarsaga
            </div>
            <div style={{
              fontSize: '1.4rem', color: C.navy, fontWeight: 700,
              letterSpacing: '-0.01em',
            }}>
              {data.nafn}
            </div>
            <div style={{
              fontSize: '0.82rem', color: C.textMuted, marginTop: '0.3rem',
            }}>
              {data.fjoldi === 1 ? 'Sat 1 fund' : `Sat ${data.fjoldi} fundi`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: C.bg, border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, marginLeft: '1rem', transition: 'background 0.15s',
          }}>
            <IconClose size={16} color={C.textSub} />
          </button>
        </div>

        {/* Meeting list */}
        <div style={{ padding: '1.25rem 1.75rem' }}>
          {data.fundir.length === 0
            ? <p style={{ color: C.textMuted, fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>Engir fundir fundnir.</p>
            : data.fundir.map((fg, i) => (
              <div key={i} style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                padding: '0.85rem 1rem', marginBottom: '0.5rem',
                borderRadius: 8, border: `1px solid ${C.border}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onClick={() => { onClose(); onOpen(fg.id); }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.gold; (e.currentTarget as HTMLDivElement).style.background = C.goldPale; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text }}>
                      {fg.fund_numer ? `${fg.fund_numer}. fundur` : fg.titill}
                    </span>
                    {fg.nefnd && (
                      <span style={{
                        fontSize: '0.65rem', background: C.bluePale, color: C.blueText,
                        padding: '0.1rem 0.45rem', borderRadius: 20, fontWeight: 600,
                      }}>{fg.nefnd}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.77rem', color: C.textMuted }}>
                    <IconCalendar size={12} color={C.textMuted} />
                    {formatDate(fg.dagsetning, true)}
                  </div>
                </div>
                <IconExternalLink size={12} color={C.textMuted} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Clickable Name ────────────────────────────────────────────────────────────
function ClickableName({ name, onClick }: { name: string; onClick: (name: string) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(name); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none', padding: 0, margin: 0,
        color: hover ? C.blueText : C.textSub,
        textDecoration: hover ? 'underline' : 'none',
        cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
        fontWeight: 'inherit', lineHeight: 'inherit',
        transition: 'color 0.15s',
      }}
    >
      {name}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [personData, setPersonData] = useState<PersonFundir | null>(null);
  const [personLoading, setPersonLoading] = useState(false);

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

  const openPerson = async (nafn: string) => {
    setPersonLoading(true); setPersonData(null);
    try {
      const res = await (await fetch(`/api/fundargerdir?nafn=${encodeURIComponent(nafn)}`)).json();
      setPersonData({ nafn, fundir: res.results || [], fjoldi: res.total || 0 });
    } finally { setPersonLoading(false); }
  };

  // Render text with clickable málsnúmer (10-digit numbers in parentheses)
  const renderTextWithMalsnumer = (text: string): React.ReactNode => {
    const parts = text.split(/(\(\d{10}\))/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      const match = part.match(/^\((\d{10})\)$/);
      if (match) {
        return (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); openTimeline(match[1]); }}
            title={`Sjá sögu máls ${match[1]}`}
            style={{
              background: C.goldPale, border: `1px solid #e8c87a`,
              borderRadius: 4, padding: '0 0.3rem',
              fontSize: 'inherit', color: '#92650a', cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: 600,
              transition: 'all 0.15s', lineHeight: 'inherit',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#fdf0d0'; (e.target as HTMLButtonElement).style.borderColor = C.gold; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = C.goldPale; (e.target as HTMLButtonElement).style.borderColor = '#e8c87a'; }}
          >
            ({match[1]})
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const hasFilters = nefnd || fra || til;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      color: C.text,
    }}>

      {/* Loading overlay for timeline */}
      {timelineLoading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,18,40,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: C.surface, borderRadius: 12, padding: '1.75rem 2.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: 18, height: 18, border: `2px solid ${C.border}`,
              borderTop: `2px solid ${C.navy}`, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: C.textSub, fontSize: '0.9rem' }}>Sæki sögu máls...</span>
          </div>
        </div>
      )}

      {timeline && !timelineLoading && (
        <TimelineModal data={timeline} onClose={() => setTimeline(null)} onOpen={openDetail} />
      )}

      {/* Loading overlay for person search */}
      {personLoading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,18,40,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: C.surface, borderRadius: 12, padding: '1.75rem 2.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: 18, height: 18, border: `2px solid ${C.border}`,
              borderTop: `2px solid ${C.navy}`, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: C.textSub, fontSize: '0.9rem' }}>Sæki fundarsögu...</span>
          </div>
        </div>
      )}

      {personData && !personLoading && (
        <PersonModal data={personData} onClose={() => setPersonData(null)} onOpen={openDetail} />
      )}

      {/* ── Header ── */}
      <header style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 60%, ${C.navyLight} 100%)`,
        borderBottom: `3px solid ${C.gold}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Official logo */}
              <div style={{
                width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img
                  src="https://www.reykjanesbaer.is/static/themes/2016/images/footerlogo.svg"
                  alt="Reykjanesbær merki"
                  style={{ width: 46, height: 46, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div style={{
                  color: C.gold, fontSize: '0.68rem', letterSpacing: '0.2em',
                  textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600,
                }}>
                  Reykjanesbær
                </div>
                <h1 style={{
                  color: C.white, margin: 0, fontSize: '1.75rem', fontWeight: 700,
                  letterSpacing: '-0.025em', lineHeight: 1.2,
                }}>
                  Fundargerðir
                </h1>
                <p style={{
                  color: 'rgba(255,255,255,0.6)', margin: '0.4rem 0 0',
                  fontSize: '0.85rem', lineHeight: 1.5,
                }}>
                  Ráð, nefndir og bæjarstjórn — smelltu á{' '}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                    color: C.goldLight, fontWeight: 500,
                  }}>
                    <IconDoc size={11} color={C.goldLight} /> málsnúmer
                  </span>
                  {' '}til að sjá sögu máls
                </p>
              </div>
            </div>
            {results && (
              <div style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '0.75rem 1.25rem', textAlign: 'center',
              }}>
                <div style={{ color: C.white, fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                  {results.total}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: '0.25rem', letterSpacing: '0.06em' }}>
                  FUNDARGERÐIR
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 1.5rem' }}>

        {/* ── Search box ── */}
        <div style={{
          background: C.surface, borderRadius: 12, padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '0.9rem', top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }}>
                <IconSearch size={17} color={C.textMuted} />
              </div>
              <input
                type="text"
                placeholder="Leita í fundargerðum eða málsnúmerum..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search(1)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.7rem 1rem 0.7rem 2.6rem',
                  fontSize: '0.95rem', border: `1.5px solid ${C.border}`,
                  borderRadius: 8, outline: 'none', fontFamily: 'inherit',
                  color: C.text, background: C.bg,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = C.navy; e.target.style.boxShadow = `0 0 0 3px rgba(15,30,61,0.08)`; e.target.style.background = C.surface; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; e.target.style.background = C.bg; }}
              />
            </div>
            <button
              onClick={() => search(1)}
              disabled={loading}
              style={{
                background: loading ? C.navyMid : `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
                color: C.white, border: 'none', borderRadius: 8,
                padding: '0.7rem 1.5rem', fontSize: '0.9rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'opacity 0.15s, transform 0.1s',
                opacity: loading ? 0.75 : 1,
                boxShadow: '0 2px 8px rgba(15,30,61,0.3)',
                flexShrink: 0,
              }}
            >
              {loading
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Leitar...</>
                : <><IconSearch size={15} color="#fff" /> Leita</>
              }
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={nefnd}
              onChange={e => setNefnd(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem', border: `1.5px solid ${C.border}`,
                borderRadius: 7, fontSize: '0.83rem', background: C.bg,
                fontFamily: 'inherit', flex: '1 1 200px', color: C.text,
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="">Allar nefndir</option>
              {nefndir.map(n => <option key={n.nefnd} value={n.nefnd}>{n.nefnd} ({n.fjoldi})</option>)}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconCalendar size={14} color={C.textMuted} />
                <input
                  type="date"
                  value={fra}
                  onChange={e => setFra(e.target.value)}
                  style={{
                    padding: '0.5rem 0.7rem', border: `1.5px solid ${C.border}`,
                    borderRadius: 7, fontSize: '0.83rem', background: C.bg,
                    fontFamily: 'inherit', color: C.text, outline: 'none',
                  }}
                />
              </div>
              <span style={{ color: C.textMuted, fontSize: '0.8rem', fontWeight: 500 }}>–</span>
              <input
                type="date"
                value={til}
                onChange={e => setTil(e.target.value)}
                style={{
                  padding: '0.5rem 0.7rem', border: `1.5px solid ${C.border}`,
                  borderRadius: 7, fontSize: '0.83rem', background: C.bg,
                  fontFamily: 'inherit', color: C.text, outline: 'none',
                }}
              />
            </div>

            {hasFilters && (
              <button
                onClick={() => { setNefnd(''); setFra(''); setTil(''); }}
                style={{
                  background: 'none', border: `1.5px solid ${C.border}`,
                  borderRadius: 7, padding: '0.48rem 0.85rem', fontSize: '0.8rem',
                  cursor: 'pointer', color: C.textSub, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
              >
                <IconClose size={12} color={C.textSub} />
                Hreinsa síur
              </button>
            )}
          </div>
        </div>

        {/* ── Content area ── */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>

          {/* ── Results list ── */}
          <div style={{ flex: selected ? '0 0 380px' : '1', minWidth: 0 }}>

            {results && (
              <div style={{
                marginBottom: '1rem', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: C.textMuted, fontSize: '0.82rem' }}>
                  {results.total} fundargerðir
                  {results.pages > 1 && (
                    <span style={{ color: C.textSub, fontWeight: 500 }}>
                      {' · '}Síða {results.page} af {results.pages}
                    </span>
                  )}
                </span>
              </div>
            )}

            {loading && !results && (
              <div style={{ textAlign: 'center', padding: '3rem', color: C.textMuted, fontStyle: 'italic' }}>
                Hleður...
              </div>
            )}

            <div>
              {results?.results.map(fg => {
                const isSelected = selected?.id === fg.id;
                const isHovered = hoveredCard === fg.id;
                return (
                  <div
                    key={fg.id}
                    onClick={() => openDetail(fg.id)}
                    onMouseEnter={() => setHoveredCard(fg.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: isSelected ? '#f0f5ff' : C.surface,
                      border: `1.5px solid ${isSelected ? C.navy : isHovered ? '#c4d4f5' : C.border}`,
                      borderLeft: `4px solid ${isSelected ? C.navy : isHovered ? '#6b8cda' : 'transparent'}`,
                      borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '0.6rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: isHovered || isSelected ? '0 4px 16px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {fg.nefnd && (
                          <div style={{
                            display: 'inline-block', background: isSelected ? C.bluePale : '#f1f5fe',
                            color: isSelected ? C.blueText : '#3b5bdb',
                            fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '0.15rem 0.55rem', borderRadius: 20, marginBottom: '0.45rem',
                            fontWeight: 700,
                          }}>
                            {fg.nefnd}
                          </div>
                        )}
                        <div style={{
                          fontWeight: 600, fontSize: '0.93rem', color: C.text,
                          marginBottom: '0.3rem', lineHeight: 1.4,
                        }}>
                          {fg.fund_numer ? `${fg.fund_numer}. fundur` : fg.titill}
                        </div>
                        {fg.thatttakendur?.length > 0 && (
                          <div style={{
                            fontSize: '0.76rem', color: C.textMuted,
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}>
                            <IconUsers size={12} color={C.textMuted} />
                            {fg.thatttakendur.slice(0, 3).join(', ')}
                            {fg.thatttakendur.length > 3 && (
                              <span style={{
                                background: C.bg, border: `1px solid ${C.border}`,
                                borderRadius: 12, padding: '0.05rem 0.4rem', fontSize: '0.68rem',
                                color: C.textSub, fontWeight: 600,
                              }}>+{fg.thatttakendur.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        color: C.textMuted, fontSize: '0.77rem', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        <IconCalendar size={12} color={C.textMuted} />
                        {formatDate(fg.dagsetning)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {results && results.pages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => search(page - 1)}
                  disabled={page <= 1}
                  style={{
                    padding: '0.45rem 1rem', border: `1.5px solid ${C.border}`,
                    borderRadius: 7, cursor: page > 1 ? 'pointer' : 'not-allowed',
                    background: C.surface, fontFamily: 'inherit', fontSize: '0.83rem',
                    color: page > 1 ? C.text : C.textMuted,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    opacity: page <= 1 ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                >
                  ← Fyrri
                </button>
                <span style={{
                  padding: '0.45rem 1rem', color: C.textSub, fontSize: '0.83rem',
                  background: C.bg, borderRadius: 7, fontWeight: 500,
                }}>
                  {page} / {results.pages}
                </span>
                <button
                  onClick={() => search(page + 1)}
                  disabled={page >= results.pages}
                  style={{
                    padding: '0.45rem 1rem', border: `1.5px solid ${C.border}`,
                    borderRadius: 7, cursor: page < results.pages ? 'pointer' : 'not-allowed',
                    background: C.surface, fontFamily: 'inherit', fontSize: '0.83rem',
                    color: page < results.pages ? C.text : C.textMuted,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    opacity: page >= results.pages ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                >
                  Næsta →
                </button>
              </div>
            )}
          </div>

          {/* ── Detail panel ── */}
          {(selected || detailLoading) && (
            <div style={{
              flex: 1, background: C.surface,
              border: `1.5px solid ${C.border}`,
              borderTop: `3px solid ${C.navy}`,
              borderRadius: 10, padding: '1.5rem',
              position: 'sticky', top: '1.5rem',
              maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}>
              {/* Panel header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: '1.25rem',
              }}>
                <div>
                  {selected?.nefnd && (
                    <div style={{
                      display: 'inline-flex',
                      background: C.bluePale, color: C.blueText,
                      fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '0.15rem 0.6rem', borderRadius: 20, fontWeight: 700,
                    }}>
                      {selected.nefnd}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: C.bg, border: 'none', borderRadius: 8,
                    width: 30, height: 30, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <IconClose size={15} color={C.textSub} />
                </button>
              </div>

              {detailLoading ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '3rem', gap: '1rem', color: C.textMuted,
                }}>
                  <div style={{
                    width: 24, height: 24, border: `2.5px solid ${C.border}`,
                    borderTop: `2.5px solid ${C.navy}`, borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>Hleður...</span>
                </div>
              ) : selected && (
                <>
                  <h2 style={{
                    margin: '0 0 0.3rem', fontSize: '1.2rem', color: C.text,
                    fontWeight: 700, lineHeight: 1.3,
                  }}>
                    {selected.fund_numer ? `${selected.fund_numer}. fundur` : selected.titill}
                  </h2>
                  <div style={{
                    color: C.textMuted, fontSize: '0.83rem', marginBottom: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <IconCalendar size={13} color={C.gold} />
                    {formatDate(selected.dagsetning)}
                  </div>

                  {(() => {
                    const parsed = selected.vidstaddir_texti
                      ? parseAttendeesFromText(selected.vidstaddir_texti)
                      : null;

                    if (parsed && parsed.nefndarmenn.length > 0) {
                      return (
                        <div style={{
                          marginBottom: '1.25rem',
                          background: C.bg, borderRadius: 8, padding: '0.85rem 1rem',
                          border: `1px solid ${C.border}`,
                        }}>
                          {/* Nefndarmenn */}
                          <div style={{
                            fontSize: '0.68rem', textTransform: 'uppercase',
                            letterSpacing: '0.12em', color: C.textMuted,
                            marginBottom: '0.4rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            <IconUsers size={12} color={C.textMuted} />
                            Nefndarmenn
                          </div>
                          <div style={{
                            fontSize: '0.83rem', color: C.textSub, lineHeight: 1.8,
                            marginBottom: parsed.forseti ? '0.15rem' : '0',
                          }}>
                            {parsed.nefndarmenn.map((name, i) => (
                              <span key={i}>
                                {i > 0 && ', '}
                                <ClickableName name={name} onClick={openPerson} />
                              </span>
                            ))}
                            {parsed.forseti && (
                              <span style={{ display: 'block', marginTop: '0.2rem', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                Í forsæti var <ClickableName name={parsed.forseti} onClick={openPerson} />.
                              </span>
                            )}
                          </div>

                          {/* Starfsmenn / Aðrir */}
                          {parsed.starfsmenn && (
                            <>
                              <div style={{
                                borderTop: `1px solid ${C.border}`,
                                marginTop: '0.65rem', paddingTop: '0.65rem',
                                fontSize: '0.68rem', textTransform: 'uppercase',
                                letterSpacing: '0.12em', color: C.textMuted,
                                marginBottom: '0.4rem', fontWeight: 600,
                              }}>
                                Starfsmenn / Aðrir
                              </div>
                              <div style={{
                                fontSize: '0.8rem', color: C.textSub, lineHeight: 1.7,
                              }}>
                                {(() => {
                                  const staffNames = extractNamesFromText(parsed.starfsmenn);
                                  if (staffNames.length === 0) return parsed.starfsmenn;
                                  // Render with clickable names
                                  let remaining = parsed.starfsmenn;
                                  const elements: React.ReactNode[] = [];
                                  let key = 0;
                                  for (const name of staffNames) {
                                    const idx = remaining.indexOf(name);
                                    if (idx === -1) continue;
                                    if (idx > 0) elements.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
                                    elements.push(<ClickableName key={key++} name={name} onClick={openPerson} />);
                                    remaining = remaining.slice(idx + name.length);
                                  }
                                  if (remaining) elements.push(<span key={key++}>{remaining}</span>);
                                  return elements;
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }

                    // Fallback: show thatttakendur array with clickable names
                    if (selected.thatttakendur?.length > 0) {
                      return (
                        <div style={{
                          marginBottom: '1.25rem',
                          background: C.bg, borderRadius: 8, padding: '0.85rem 1rem',
                          border: `1px solid ${C.border}`,
                        }}>
                          <div style={{
                            fontSize: '0.68rem', textTransform: 'uppercase',
                            letterSpacing: '0.12em', color: C.textMuted,
                            marginBottom: '0.5rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            <IconUsers size={12} color={C.textMuted} />
                            Þátttakendur
                          </div>
                          <div style={{
                            fontSize: '0.83rem', color: C.textSub, lineHeight: 1.7,
                          }}>
                            {selected.thatttakendur.map((name, i) => (
                              <span key={i}>
                                {i > 0 && ' · '}
                                <ClickableName name={name} onClick={openPerson} />
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem' }}>
                    <div style={{
                      fontSize: '0.68rem', textTransform: 'uppercase',
                      letterSpacing: '0.12em', color: C.textMuted,
                      marginBottom: '1rem', fontWeight: 600,
                    }}>
                      Dagskrá
                    </div>
                    {selected.dagskrarlidur?.map((l, i) => (
                      <div key={i} style={{
                        marginBottom: '1rem', padding: '0.85rem 1rem',
                        borderLeft: `3px solid ${l.akvardan ? C.green : C.border}`,
                        borderRadius: '0 8px 8px 0',
                        background: l.akvardan ? C.greenPale : 'transparent',
                        border: `1px solid ${l.akvardan ? C.greenBord : C.border}`,
                        borderLeftWidth: 3,
                        borderLeftColor: l.akvardan ? C.green : C.navyLight + '44',
                      }}>
                        <div style={{
                          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                          flexWrap: 'wrap', marginBottom: l.texti || l.akvardan ? '0.4rem' : 0,
                        }}>
                          <span style={{
                            fontWeight: 600, fontSize: '0.87rem', color: C.text, lineHeight: 1.4,
                          }}>
                            {l.numer ? `${l.numer}. ` : ''}{l.heiti}
                          </span>
                          {l.malsnumer && (
                            <MalsnumerTag nr={l.malsnumer} onClick={openTimeline} />
                          )}
                        </div>
                        {l.texti && (
                          <div style={{
                            fontSize: '0.81rem', color: C.textSub, lineHeight: 1.65,
                            whiteSpace: 'pre-line', marginBottom: l.akvardan ? '0.4rem' : 0,
                          }}>
                            {l.texti.split('\n').map((line, li) => (
                              <span key={li}>
                                {li > 0 && '\n'}
                                {renderTextWithMalsnumer(line)}
                              </span>
                            ))}
                          </div>
                        )}
                        {l.akvardan && (
                          <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                            marginTop: '0.3rem', fontSize: '0.79rem', color: C.green,
                            fontWeight: 500,
                          }}>
                            <div style={{ flexShrink: 0, marginTop: '0.15rem' }}>
                              <IconCheck size={12} color={C.green} />
                            </div>
                            <span>{l.akvardan}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selected.source_url && (
                    <a
                      href={selected.source_url}
                      target="_blank"
                      rel="noopener"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        marginTop: '1rem', fontSize: '0.8rem', color: C.textMuted,
                        textDecoration: 'none',
                        padding: '0.4rem 0.75rem',
                        border: `1px solid ${C.border}`,
                        borderRadius: 7, transition: 'all 0.15s',
                      }}
                    >
                      Upprunaleg fundargerð
                      <IconExternalLink size={12} color={C.textMuted} />
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.5; cursor: pointer;
        }
        select:focus, input:focus {
          outline: none;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
