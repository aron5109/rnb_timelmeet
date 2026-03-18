#!/usr/bin/env python3
"""
Sækir allar fundargerðir bæjarstjórnar Reykjanesbæjar og vistar sem HTML skrár.
Notkun: python fetch_baejarstjorn.py [--limit 50] [--output ./html]
"""

import sys
import time
import argparse
import re
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

BASE = "https://www.reykjanesbaer.is"
LIST_URL = f"{BASE}/is/stjornsysla/stjornsyslan/fundargerdir/baejarstjorn"
HEADERS = {"User-Agent": "Mozilla/5.0 (RNB-Timalina/1.0; +https://github.com/aron5109/rnb_timelmeet)"}


def fetch(url: str, retries=3) -> str:
    for attempt in range(retries):
        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=15) as r:
                return r.read().decode("utf-8", errors="replace")
        except (HTTPError, URLError) as e:
            print(f"  Villa {attempt+1}/{retries}: {e}", file=sys.stderr)
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return ""


def get_meeting_urls(limit: int) -> list[tuple[str, str]]:
    """Skilar lista af (url, slug) pörum."""
    print("Sæki lista yfir fundargerðir...", file=sys.stderr)
    html = fetch(LIST_URL)
    if not html:
        print("Gat ekki sótt lista!", file=sys.stderr)
        return []

    # Finna allar tenglar á fundargerðir
    pattern = r'href="(/is/stjornsysla/stjornsyslan/fundargerdir/baejarstjorn/([^"]+))"'
    matches = re.findall(pattern, html)

    seen = set()
    urls = []
    for path, slug in matches:
        if slug and slug not in seen and slug != "baejarstjorn":
            seen.add(slug)
            urls.append((f"{BASE}{path}", slug))

    print(f"Fann {len(urls)} fundargerðir", file=sys.stderr)
    return urls[:limit]


def main():
    parser = argparse.ArgumentParser(description="Sækir fundargerðir bæjarstjórnar")
    parser.add_argument("--limit", type=int, default=50, help="Hámarksfjöldi (default: 50)")
    parser.add_argument("--output", default="./html_baejarstjorn", help="Útgangsmappa")
    parser.add_argument("--delay", type=float, default=0.5, help="Seinkun milli beiðna í sekúndum")
    args = parser.parse_args()

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    urls = get_meeting_urls(args.limit)
    if not urls:
        sys.exit(1)

    downloaded = 0
    skipped = 0

    for i, (url, slug) in enumerate(urls):
        # Hreinsa slug fyrir skráarheiti
        filename = re.sub(r'[^\w\-]', '_', slug) + ".html"
        filepath = out / filename

        if filepath.exists():
            print(f"[{i+1}/{len(urls)}] Þegar til: {filename}", file=sys.stderr)
            skipped += 1
            continue

        print(f"[{i+1}/{len(urls)}] Sæki: {slug}", file=sys.stderr)
        html = fetch(url)

        if html:
            filepath.write_text(html, encoding="utf-8")
            downloaded += 1
        else:
            print(f"  Mistókst: {url}", file=sys.stderr)

        time.sleep(args.delay)

    print(f"\nNiðurstaða: {downloaded} sótt, {skipped} þegar til, {len(urls)-downloaded-skipped} mistókst", file=sys.stderr)
    print(f"HTML skrár í: {out.resolve()}", file=sys.stderr)


if __name__ == "__main__":
    main()
