import { sql } from '@vercel/postgres';

export async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS fundargerdir (
      id SERIAL PRIMARY KEY,
      filename TEXT,
      fund_numer INTEGER,
      nefnd TEXT,
      dagsetning TIMESTAMPTZ,
      titill TEXT,
      thatttakendur TEXT[],
      dagskrarlidur JSONB,
      source_url TEXT,
      leitartexti TSVECTOR,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(source_url),
      UNIQUE(filename)
    );
  `;

  // Sérstök tafla fyrir málsnúmer → auðveldar timeline leit
  await sql`
    CREATE TABLE IF NOT EXISTS malsnumer_index (
      id SERIAL PRIMARY KEY,
      malsnumer TEXT NOT NULL,
      fundargerd_id INTEGER REFERENCES fundargerdir(id) ON DELETE CASCADE,
      dagsetning TIMESTAMPTZ,
      nefnd TEXT,
      fund_numer INTEGER,
      lidur_numer INTEGER,
      lidur_heiti TEXT,
      akvardan TEXT,
      UNIQUE(malsnumer, fundargerd_id, lidur_numer)
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS malsnumer_idx ON malsnumer_index(malsnumer);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS malsnumer_dag_idx ON malsnumer_index(dagsetning ASC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS fundargerdir_leit_idx ON fundargerdir USING GIN(leitartexti);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS fundargerdir_dagsetning_idx ON fundargerdir(dagsetning DESC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS fundargerdir_nefnd_idx ON fundargerdir(nefnd);
  `;
}

export function buildSearchVector(fundargerd: {
  titill?: string;
  thatttakendur?: string[];
  dagskrarlidur?: Array<{ heiti?: string; texti?: string; akvardan?: string; malsnumer?: string }>;
}): string {
  const parts: string[] = [];
  if (fundargerd.titill) parts.push(fundargerd.titill);
  if (fundargerd.thatttakendur?.length) parts.push(fundargerd.thatttakendur.join(' '));
  if (fundargerd.dagskrarlidur?.length) {
    for (const l of fundargerd.dagskrarlidur) {
      if (l.heiti) parts.push(l.heiti);
      if (l.texti) parts.push(l.texti);
      if (l.akvardan) parts.push(l.akvardan);
      if (l.malsnumer) parts.push(l.malsnumer);
    }
  }
  return parts.join(' ');
}
