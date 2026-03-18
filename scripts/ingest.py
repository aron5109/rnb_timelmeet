#!/usr/bin/env python3
"""
Þáttar HTML fundargerðir og sendir á ingest API.
Notkun: python ingest.py --html ./html_baejarstjorn --api https://timelines-three.vercel.app --secret ÞITT_LEYNIORÐ
"""

import sys
import json
import argparse
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError

# Nota parse_fundargerd úr sömu möppu
sys.path.insert(0, str(Path(__file__).parent))
from parse_fundargerd import parse_html


def send_batch(api_url: str, secret: str, fundargerdir: list) -> dict:
    payload = json.dumps({"fundargerdir": fundargerdir}).encode("utf-8")
    req = Request(
        f"{api_url}/api/ingest",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP villa {e.code}: {body}", file=sys.stderr)
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Sendir fundargerðir á API")
    parser.add_argument("--html", default="./html_baejarstjorn", help="Mappa með HTML skrám")
    parser.add_argument("--api", default="https://timelines-three.vercel.app", help="API slóð")
    parser.add_argument("--secret", required=True, help="INGEST_SECRET gildi")
    parser.add_argument("--batch", type=int, default=10, help="Fjöldi í hverri sending")
    parser.add_argument("--dry-run", action="store_true", help="Þátta en senda ekki")
    args = parser.parse_args()

    html_dir = Path(args.html)
    files = sorted(html_dir.glob("*.html"))
    print(f"Fann {len(files)} HTML skrár", file=sys.stderr)

    parsed = []
    errors = []

    for f in files:
        try:
            html = f.read_text(encoding="utf-8", errors="replace")
            data = parse_html(html, f.name)
            # Bæta við source_url ef vantar
            if not data.get("source_url"):
                slug = f.stem.replace("_", "-")
                data["source_url"] = f"https://www.reykjanesbaer.is/is/stjornsysla/stjornsyslan/fundargerdir/baejarstjorn/{slug}"
            parsed.append(data)
        except Exception as e:
            print(f"Villa við þáttun {f.name}: {e}", file=sys.stderr)
            errors.append(f.name)

    print(f"Þáttaði {len(parsed)} fundargerðir ({len(errors)} villur)", file=sys.stderr)

    if args.dry_run:
        print(json.dumps(parsed[:2], ensure_ascii=False, indent=2))
        return

    # Senda í lotum
    total_inserted = 0
    total_updated = 0

    for i in range(0, len(parsed), args.batch):
        batch = parsed[i:i + args.batch]
        print(f"Sendi lotu {i//args.batch + 1} ({len(batch)} skrár)...", file=sys.stderr)
        result = send_batch(args.api, args.secret, batch)
        if "error" in result:
            print(f"  VILLA: {result['error']}", file=sys.stderr)
        else:
            ins = result.get("inserted", 0)
            upd = result.get("updated", 0)
            total_inserted += ins
            total_updated += upd
            print(f"  ✓ {ins} nýjar, {upd} uppfærðar", file=sys.stderr)
            if result.get("errors"):
                for e in result["errors"]:
                    print(f"  ⚠ {e}", file=sys.stderr)

    print(f"\nHotalt: {total_inserted} nýjar, {total_updated} uppfærðar", file=sys.stderr)


if __name__ == "__main__":
    main()
