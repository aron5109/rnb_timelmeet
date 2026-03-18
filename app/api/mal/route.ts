import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/mal?nr=2024010003  → Timeline fyrir eitt málsnúmer
// GET /api/mal?leit=húsnæði    → Leita að málsnúmerum eftir texta
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const nr = searchParams.get('nr');
  const leit = searchParams.get('leit');

  if (nr) {
    // Sækja alla fundargerðir þar sem þetta málsnúmer kemur fyrir — í tímaröð
    const result = await sql`
      SELECT
        mi.malsnumer,
        mi.dagsetning,
        mi.nefnd,
        mi.fund_numer,
        mi.lidur_numer,
        mi.lidur_heiti,
        mi.akvardan,
        f.id AS fundargerd_id,
        f.source_url,
        f.titill AS fundargerd_titill
      FROM malsnumer_index mi
      JOIN fundargerdir f ON f.id = mi.fundargerd_id
      WHERE mi.malsnumer = ${nr}
      ORDER BY mi.dagsetning ASC
    `;

    return NextResponse.json({
      malsnumer: nr,
      timeline: result.rows,
      fjoldi: result.rows.length,
    });
  }

  if (leit) {
    // Leita að málsnúmerum eftir titli dagskrárliðar
    const result = await sql`
      SELECT DISTINCT
        mi.malsnumer,
        mi.lidur_heiti,
        COUNT(*) OVER (PARTITION BY mi.malsnumer) AS birtingar,
        MIN(mi.dagsetning) OVER (PARTITION BY mi.malsnumer) AS fyrst_birt,
        MAX(mi.dagsetning) OVER (PARTITION BY mi.malsnumer) AS sidast_birt
      FROM malsnumer_index mi
      WHERE mi.lidur_heiti ILIKE ${'%' + leit + '%'}
         OR mi.malsnumer = ${leit}
      ORDER BY mi.malsnumer
      LIMIT 50
    `;
    return NextResponse.json({ results: result.rows });
  }

  // Sýna yfirlit yfir mál með flestar birtingar (mest umtöluð mál)
  const result = await sql`
    SELECT
      malsnumer,
      MAX(lidur_heiti) AS heiti,
      COUNT(*) AS birtingar,
      MIN(dagsetning) AS fyrst_birt,
      MAX(dagsetning) AS sidast_birt,
      STRING_AGG(DISTINCT nefnd, ', ' ORDER BY nefnd) AS nefndir
    FROM malsnumer_index
    GROUP BY malsnumer
    HAVING COUNT(*) > 1
    ORDER BY birtingar DESC
    LIMIT 50
  `;

  return NextResponse.json({ results: result.rows });
}
