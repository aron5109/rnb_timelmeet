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

// GET /api/fundargerdir?q=húsnæði&nefnd=Bæjarstjórn&fra=2024-01-01&til=2025-01-01&page=1
// GET /api/fundargerdir?id=42
// GET /api/fundargerdir?nefndir=1   → listi yfir allar nefndir
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
  } catch (e) {
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

  // Skila lista yfir nefndir
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

  // Skila einni fundargerð með dagskrárliðum
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

  // Leit
  let countResult, dataResult;

  if (q && q.trim()) {
    // Fulltext leit
    const search = q.trim().split(/\s+/).map(w => w + ':*').join(' & ');
    countResult = await sql`
      SELECT COUNT(*) FROM fundargerdir
      WHERE leitartexti @@ to_tsquery('simple', ${search})
        AND (${nefnd} IS NULL OR nefnd = ${nefnd})
        AND (${fra} IS NULL OR dagsetning >= ${fra}::timestamptz)
        AND (${til} IS NULL OR dagsetning <= ${til}::timestamptz)
    `;
    dataResult = await sql`
      SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, source_url
      FROM fundargerdir
      WHERE leitartexti @@ to_tsquery('simple', ${search})
        AND (${nefnd} IS NULL OR nefnd = ${nefnd})
        AND (${fra} IS NULL OR dagsetning >= ${fra}::timestamptz)
        AND (${til} IS NULL OR dagsetning <= ${til}::timestamptz)
      ORDER BY dagsetning DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    countResult = await sql`
      SELECT COUNT(*) FROM fundargerdir
      WHERE (${nefnd} IS NULL OR nefnd = ${nefnd})
        AND (${fra} IS NULL OR dagsetning >= ${fra}::timestamptz)
        AND (${til} IS NULL OR dagsetning <= ${til}::timestamptz)
    `;
    dataResult = await sql`
      SELECT id, fund_numer, nefnd, dagsetning, titill, thatttakendur, source_url
      FROM fundargerdir
      WHERE (${nefnd} IS NULL OR nefnd = ${nefnd})
        AND (${fra} IS NULL OR dagsetning >= ${fra}::timestamptz)
        AND (${til} IS NULL OR dagsetning <= ${til}::timestamptz)
      ORDER BY dagsetning DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const total = parseInt(countResult.rows[0].count);
  return NextResponse.json({
    results: dataResult.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
