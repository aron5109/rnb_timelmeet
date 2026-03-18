# Fundargerðir Reykjanesbæjar

Leit og tímalína fundargerða bæjarstjórnar og nefnda Reykjanesbæjar.

## Uppbygging

```
app/
  page.tsx                    ← Aðalsíða (UI)
  api/
    fundargerdir/route.ts     ← Leit í fundargerðum
    mal/route.ts              ← Tímalína eins máls
    ingest/route.ts           ← Geyma fundargerðir í DB
lib/
  db.ts                       ← Gagnagrunnur
scripts/
  fetch_baejarstjorn.py       ← Sækir HTML fundargerðir
  parse_fundargerd.py         ← Þáttar HTML í JSON
  ingest.py                   ← Sendir á API
```

## Uppsetning

### 1. Vercel Postgres

1. Farðu á [vercel.com](https://vercel.com) → þitt verkefni → **Storage**
2. Smelltu á **Create Database** → **Postgres**
3. Gefðu henni nafn t.d. `timelines-db`
4. Veldu **Connect** → Vercel setur sjálfkrafa inn env breytur

### 2. INGEST_SECRET

Í Vercel → **Settings** → **Environment Variables** bættu við:
- `INGEST_SECRET` = eitthvað langt og handahófskennt, t.d. `rnb2024superleynilegt`

### 3. GitHub

Hlaðaðu upp öllum skrám í `rnb-timalina/` möppuna á GitHub.
Vercel redeploy-ar sjálfkrafa.

### 4. Sækja fundargerðir (Python)

```bash
# Setja upp
pip install beautifulsoup4

# Sækja HTML (50 nýjustu)
python scripts/fetch_baejarstjorn.py --limit 50 --output ./html_baejarstjorn

# Senda á API
python scripts/ingest.py \
  --html ./html_baejarstjorn \
  --api https://timelines-three.vercel.app \
  --secret rnb2024superleynilegt
```

## Bæta við fleiri nefndum

Síðar getum við bætt við t.d. bæjarráði:
```bash
python scripts/fetch_baejarstjorn.py \
  --url https://www.reykjanesbaer.is/is/stjornsysla/stjornsyslan/fundargerdir/baejarrad \
  --output ./html_baejarrad
```
