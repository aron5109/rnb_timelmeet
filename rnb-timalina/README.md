# Tímalína Bæjarstjórnar Reykjanesbæjar

Gagnvirk tímalína sem greini fundargerðir bæjarstjórnar Reykjanesbæjar með Claude gervigreind.

## Eiginleikar

- 🔄 Sækir sjálfkrafa nýjustu fundargerðir frá reykjanesbaer.is
- 🤖 Notar Claude til að greina og skipuleggja atburði
- 🗓 Gagnvirk tímalína með síum og leit
- 🎨 Reykjanesbær hönnunarstaðall (blár #003865, gullinn #C8A951)
- 📱 Svarar á öllum skjástærðum
- 🖨 Prentvinænn

## Uppsetning á Vercel

### 1. Klóna verkefnið
```bash
git clone <your-repo-url>
cd rnb-timalina
```

### 2. Setja upp á Vercel
1. Farðu á [vercel.com](https://vercel.com) og skráðu þig inn
2. Smelltu á **"Add New Project"**
3. Tengdu GitHub geymslu þína
4. Undir **Environment Variables** bættu við:
   - `ANTHROPIC_API_KEY` = þitt Anthropic API lykill
5. Smelltu á **Deploy**

### 3. Anthropic API lykill
Sæktu API lykil á [console.anthropic.com](https://console.anthropic.com)

## Keyra staðbundið

```bash
npm install
cp .env.local.example .env.local
# Breyttu ANTHROPIC_API_KEY í .env.local
npm run dev
```

Farðu á http://localhost:3000

## Tæknileg uppbygging

```
pages/
  index.tsx          # Aðalsíða með gagnvirkri tímalínu
  api/
    timeline.ts      # API endpoint: sækir og greinir fundargerðir
lib/
  scraper.ts         # Sækir fundargerðir frá reykjanesbaer.is
  analyzer.ts        # Claude AI greining
  types.ts           # TypeScript týpur
```

## Vercel Timeout

API endapunkturinn getur tekið allt að 60 sekúndur. Með Vercel Pro er hægt að auka tímamark í `vercel.json`:

```json
{
  "functions": {
    "pages/api/timeline.ts": {
      "maxDuration": 60
    }
  }
}
```

## Höfundarréttur

Fundargerðirnar tilheyra Reykjanesbæ. Þetta tól er opið og óopinbert.
