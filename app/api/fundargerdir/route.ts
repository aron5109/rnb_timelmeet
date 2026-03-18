import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';

let dbReady = false;

async function ensureDb() {
  if (!dbReady) {
    await setupDatabase();
    dbReady = true;
  }
}

export async function GET(request: NextRequest) {
  try { await ensureDb(); } catch {
    return NextResponse.json({ error: 'Gagnagrunn villa' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const q = searchParams.get('q') || '';
  const nefnd = searchParams.get('nefnd') || '';
  const fra = searchParams.get('fra') || '';
  const til = searchParams.get('til') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    if (searchParams.get('nefndir')) {
      const r = await sql`SELECT nefnd, COUNT(*) AS fjoldi FROM fundargerdir WHERE nefnd IS NOT NULL GROUP BY nefnd ORDER BY fjoldi DESC`;
      return NextResponse.json({ nefndir: r.rows });
    }

    if (id) {
      const r = await sql`SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, dagskrarlidur, source_url, vidstaddir_texti FROM fundargerdir WHERE id = ${parseInt(id)}`;
      return NextResponse.json(r.rows[0] || {});
    }

    // Search by person name (attendee)
    const nafn = searchParams.get('nafn');
    if (nafn) {
      const r = await sql`
        SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, source_url
        FROM fundargerdir
        WHERE thatttakendur::text ILIKE ${'%' + nafn + '%'}
           OR vidstaddir_texti ILIKE ${'%' + nafn + '%'}
        ORDER BY dagsetning DESC
        LIMIT 100
      `;
      return NextResponse.json({ results: r.rows, total: r.rows.length });
    }

    // Byggja upp síur sem strengi
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let i = 1;

    if (q) {
      const search = q.trim().split(/\s+/).map(w => w + ':*').join(' & ');
      conditions.push(`leitartexti @@ to_tsquery('simple', $${i++})`);
      values.push(search);
    }
    if (nefnd) { conditions.push(`nefnd = $${i++}`); values.push(nefnd); }
    if (fra) { conditions.push(`dagsetning >= $${i++}::timestamptz`); values.push(fra); }
    if (til) { conditions.push(`dagsetning <= $${i++}::timestamptz`); values.push(til); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM fundargerdir ${where}`;
    const dataQuery = `SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, source_url FROM fundargerdir ${where} ORDER BY dagsetning DESC LIMIT $${i} OFFSET $${i+1}`;

    const { rows: countRows } = await sql.query(countQuery, values);
    const { rows } = await sql.query(dataQuery, [...values, limit, offset]);

    const total = parseInt(countRows[0].count);
    return NextResponse.json({ results: rows, total, page, pages: Math.ceil(total / limit) });

  } catch (e) {
    console.error('Villa:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
