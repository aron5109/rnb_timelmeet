import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase, buildSearchVector } from '@/lib/db';

// Keyrir einu sinni við ræsingu
let dbReady = false;

export async function POST(request: NextRequest) {
  // Sannvotta beiðni
  const auth = request.headers.get('Authorization');
  const secret = process.env.INGEST_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Óheimilt' }, { status: 401 });
  }

  // Setja upp gagnagrunn ef þarf
  if (!dbReady) {
    try {
      await setupDatabase();
      dbReady = true;
    } catch (e) {
      console.error('DB setup villa:', e);
      return NextResponse.json({ error: 'Gagnagrunn villa' }, { status: 500 });
    }
  }

  let body: { fundargerdir: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ógilt JSON' }, { status: 400 });
  }

  const fundargerdir = body.fundargerdir;
  if (!Array.isArray(fundargerdir)) {
    return NextResponse.json({ error: 'fundargerdir verður að vera array' }, { status: 400 });
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const fg of fundargerdir as Record<string, unknown>[]) {
    try {
      const leitartexti = buildSearchVector({
        titill: fg.titill as string,
        thatttakendur: fg.thatttakendur as string[],
        dagskrarlidur: fg.dagskrarlidur as Array<{heiti?: string; texti?: string; akvardan?: string}>,
      });

      const result = await sql`
        INSERT INTO fundargerdir (
          filename, fund_numer, nefnd, dagsetning, titill,
          thatttakendur, dagskrarlidur, source_url, leitartexti, vidstaddir_texti
        )
        VALUES (
          ${fg.filename as string},
          ${fg.fund_numer as number},
          ${fg.nefnd as string},
          ${fg.dagsetning as string},
          ${fg.titill as string},
          ${JSON.stringify(fg.thatttakendur || [])},
          ${JSON.stringify(fg.dagskrarlidur)}::jsonb,
          ${fg.source_url as string},
          to_tsvector('simple', ${leitartexti}),
          ${(fg.vidstaddir_texti as string) || null}
        )
        ON CONFLICT (filename) DO UPDATE SET
          fund_numer = EXCLUDED.fund_numer,
          nefnd = EXCLUDED.nefnd,
          dagsetning = EXCLUDED.dagsetning,
          titill = EXCLUDED.titill,
          thatttakendur = ${JSON.stringify(fg.thatttakendur || [])}::jsonb,
          dagskrarlidur = EXCLUDED.dagskrarlidur,
          source_url = EXCLUDED.source_url,
          leitartexti = EXCLUDED.leitartexti,
          vidstaddir_texti = EXCLUDED.vidstaddir_texti,
          updated_at = NOW()
        RETURNING id, (xmax = 0) AS was_inserted
      `;

      const fundargerdId = result.rows[0]?.id;
      if (result.rows[0]?.was_inserted) {
        inserted++;
      } else {
        updated++;
      }

      // Færa inn málsnúmer í index töfluna
      if (fundargerdId) {
        // Hreinsa gamla færslur fyrir þessa fundargerð (ef uppfærsla)
        await sql`DELETE FROM malsnumer_index WHERE fundargerd_id = ${fundargerdId}`;

        const lidar = (fg.dagskrarlidur as Array<{
          numer?: number; heiti?: string; malsnumer?: string; akvardan?: string;
        }>) || [];

        for (const lidur of lidar) {
          if (!lidur.malsnumer) continue;
          await sql`
            INSERT INTO malsnumer_index
              (malsnumer, fundargerd_id, dagsetning, nefnd, fund_numer, lidur_numer, lidur_heiti, akvardan)
            VALUES (
              ${lidur.malsnumer},
              ${fundargerdId},
              ${fg.dagsetning as string},
              ${fg.nefnd as string},
              ${fg.fund_numer as number},
              ${lidur.numer ?? null},
              ${lidur.heiti ?? null},
              ${lidur.akvardan ?? null}
            )
            ON CONFLICT (malsnumer, fundargerd_id, lidur_numer) DO NOTHING
          `;
        }
      }
    } catch (e) {
      const msg = `Villa við ${fg.filename}: ${e}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return NextResponse.json({
    ok: true,
    inserted,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
