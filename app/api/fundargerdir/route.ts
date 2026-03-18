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
  try {
    await ensureDb();
  } catch {
    return NextResponse.json({ error: 'Gagnagrunn villa' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const q = searchParams.get('q');
  const nefnd = searchParams.get('nefnd');
  const fra = searchParams.get('fra');
  const til = searchParams.get('til');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;
  const nefndirOnly = searchParams.get('nefndir');

  try {
    if (nefndirOnly) {
      const result = await sql`
        SELECT nefnd, COUNT(*) AS fjoldi
        FROM fundargerdir
        WHERE nefnd IS NOT NULL
        GROUP BY nefnd
        ORDER BY fjoldi DESC
      `;
      return NextResponse.json({ nefndir: result.rows });
    }

    if (id) {
      const result = await sql`
        SELECT id, fund_numer, nefnd, dagsetning, titill,
               thatttakendur, dagskrarlidur, source_url
        FROM fundargerdir WHERE id = ${parseInt(id)}
      `;
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Ekki fundin' }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    }

    if (q && q.trim()) {
      const search = q.trim().split(/\s+/).map((w: string) => w + ':*').join(' & ');
      const countResult = await sql`
        SELECT COUNT(*) FROM fundargerdir
        WHERE leitartexti @@ to_tsquery('simple', ${search})
        ${nefnd ? sql`AND nefnd = ${nefnd}` : sql``}
        ${fra ? sql`AND dagsetning >= ${fra}::timestamptz` : sql``}
        ${til ? sql`AND dagsetning <= ${til}::timestamptz` : sql``}
      `;
      const dataResult = await sql`
        SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, source_url
        FROM fundargerdir
        WHERE leitartexti @@ to_tsquery('simple', ${search})
        ${nefnd ? sql`AND nefnd = ${nefnd}` : sql``}
        ${fra ? sql`AND dagsetning >= ${fra}::timestamptz` : sql``}
        ${til ? sql`AND dagsetning <= ${til}::timestamptz` : sql``}
        ORDER BY dagsetning DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const total = parseInt(countResult.rows[0].count);
      return NextResponse.json({ results: dataResult.rows, total, page, pages: Math.ceil(total / limit) });
    }

    const countResult = await sql`
      SELECT COUNT(*) FROM fundargerdir
      ${nefnd ? sql`WHERE nefnd = ${nefnd}` : sql`WHERE TRUE`}
      ${fra ? sql`AND dagsetning >= ${fra}::timestamptz` : sql``}
      ${til ? sql`AND dagsetning <= ${til}::timestamptz` : sql``}
    `;
    const dataResult = await sql`
      SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, source_url
      FROM fundargerdir
      ${nefnd ? sql`WHERE nefnd = ${nefnd}` : sql`WHERE TRUE`}
      ${fra ? sql`AND dagsetning >= ${fra}::timestamptz` : sql``}
      ${til ? sql`AND dagsetning <= ${til}::timestamptz` : sql``}
      ORDER BY dagsetning DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const total = parseInt(countResult.rows[0].count);
    return NextResponse.json({ results: dataResult.rows, total, page, pages: Math.ceil(total / limit) });

  } catch (e) {
    console.error('Fundargerdir villa:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
