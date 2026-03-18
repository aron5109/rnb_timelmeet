#!/usr/bin/env python3
"""
Fundargerðar parser - dregur út hreinar upplýsingar úr HTML fundargerðum.
Notkun: python parse_fundargerd.py <skrá.html>  eða  python parse_fundargerd.py <mappa/>
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Vantar BeautifulSoup: pip install beautifulsoup4")
    sys.exit(1)


def parse_attendees(text: str) -> list[str]:
    """Finnur nöfn þátttakenda úr texta."""
    # Fjarlægir allt á eftir "Að auki" eða "í forsæti"
    names_text = re.split(r'Að auki|í forsæti', text, flags=re.IGNORECASE)[0]
    # Fjarlægir "Viðstaddir:" og svipað
    names_text = re.sub(r'^Viðstaddir:\s*', '', names_text.strip())
    # Skiptir á kommu og "og" og hreinsnar
    names_text = re.sub(r'\s+og\s+', ', ', names_text)
    names = [n.strip().rstrip('.') for n in names_text.split(',') if n.strip()]
    return [n for n in names if len(n) > 3]


def parse_date(date_str: str) -> str | None:
    """Umbreytir 'DD.MM.YYYY HH:MM' yfir í ISO snið."""
    try:
        dt = datetime.strptime(date_str.strip(), "%d.%m.%Y %H:%M")
        return dt.isoformat()
    except Exception:
        return date_str.strip()


def parse_html(html_content: str, filename: str = "") -> dict:
    soup = BeautifulSoup(html_content, "html.parser")

    result = {
        "filename": filename,
        "fund_numer": None,
        "nefnd": None,
        "dagsetning": None,
        "titill": None,
        "thatttakendur": [],
        "vidstaddir_texti": None,
        "dagskrarlidur": [],
        "source_url": None,
    }

    # --- Source URL ---
    og_url = soup.find("meta", {"property": "og:url"})
    if og_url:
        result["source_url"] = og_url.get("content", "")

    # --- Finna aðalinnihald ---
    single_item = soup.find("div", class_="singleItem")
    if not single_item:
        # fallback: leita að meetings box
        single_item = soup.find("div", id="meetings")

    if not single_item:
        return result

    # --- Dagsetning ---
    date_div = single_item.find("div", class_="date")
    if date_div:
        result["dagsetning"] = parse_date(date_div.get_text(strip=True))

    # --- Aðaltitill ---
    h2 = single_item.find("h2")
    if h2:
        full_title = h2.get_text(strip=True)
        result["titill"] = full_title

        # Draga út fundarnúmer
        m = re.search(r'(\d+)\.?\s*fundur', full_title, re.IGNORECASE)
        if m:
            result["fund_numer"] = int(m.group(1))

        # Draga út nefnd/ráð
        nefnd_patterns = [
            r'fundur\s+(.+?)\s*[-–]',
            r'fundur\s+(.+?)\s*,',
            r'fundur\s+(.+?)(?:\s+haldinn|\s*$)',
        ]
        for pat in nefnd_patterns:
            m2 = re.search(pat, full_title, re.IGNORECASE)
            if m2:
                result["nefnd"] = m2.group(1).strip()
                break

    # --- Þátttakendur ---
    # Collect the full attendee text block (may span multiple paragraphs)
    paragraphs = single_item.find_all("p")
    vidstaddir_parts = []
    found_vidstaddir = False
    for p in paragraphs[:8]:  # Attendee info is in the first few paragraphs
        txt = p.get_text(strip=True)
        if "Viðstaddir" in txt or "viðstaddir" in txt:
            found_vidstaddir = True
            vidstaddir_parts.append(txt)
            result["thatttakendur"] = parse_attendees(txt)
        elif found_vidstaddir:
            # Capture continuation lines (Að auki, forföll, etc.)
            if any(kw in txt.lower() for kw in ["að auki", "boðaði forföll", "sat fundinn", "sat fyrir"]):
                vidstaddir_parts.append(txt)
            else:
                break  # Stop when we hit non-attendee content

    if vidstaddir_parts:
        result["vidstaddir_texti"] = " ".join(vidstaddir_parts)

    # --- Dagskrárliðir (h3 tags) ---
    dagskrar = []
    for h3 in single_item.find_all("h3"):
        liður_titill = h3.get_text(strip=True)

        # Draga út málsnúmer t.d. (2024010003)
        malsnumer = None
        m_mal = re.search(r'\((\d{10})\)', liður_titill)
        if m_mal:
            malsnumer = m_mal.group(1)
            # Fjarlægja málsnúmerið úr titlinum
            liður_titill_hreinn = re.sub(r'\s*\(\d{10}\)', '', liður_titill).strip()
        else:
            liður_titill_hreinn = liður_titill

        # Númer dagskrárliðar
        m = re.match(r'^(\d+)[\.\s]+(.+)', liður_titill_hreinn)
        if m:
            lidur_numer = int(m.group(1))
            lidur_heiti = m.group(2).strip()
        else:
            lidur_numer = None
            lidur_heiti = liður_titill_hreinn

        # Safna texta sem kemur á eftir h3 (þar til næsta h3)
        texti_parts = []
        akvardan = None
        sibling = h3.find_next_sibling()
        while sibling and sibling.name != "h3":
            if sibling.name == "p":
                txt = sibling.get_text(strip=True)
                if txt:
                    texti_parts.append(txt)
                    # Leita að atkvæðagreiðslu / samþykkt
                    if re.search(r'samþykkt\s+\d+[-–]\d+|samþykkt\s+án\s+umræðu|samþykkt\s+einróma', txt, re.IGNORECASE):
                        akvardan = txt
            sibling = sibling.find_next_sibling()

        dagskrar.append({
            "numer": lidur_numer,
            "heiti": lidur_heiti,
            "malsnumer": malsnumer,
            "texti": "\n".join(texti_parts),
            "akvardan": akvardan,
        })

    result["dagskrarlidur"] = dagskrar
    return result


def process_file(path: Path) -> dict | None:
    try:
        html = path.read_text(encoding="utf-8", errors="replace")
        data = parse_html(html, path.name)
        return data
    except Exception as e:
        print(f"Villa við lestur {path}: {e}", file=sys.stderr)
        return None


def main():
    if len(sys.argv) < 2:
        print("Notkun: python parse_fundargerd.py <skrá.html eða mappa>")
        sys.exit(1)

    target = Path(sys.argv[1])
    results = []

    if target.is_dir():
        files = list(target.glob("*.html")) + list(target.glob("**/*.html"))
        print(f"Fann {len(files)} HTML skrár...", file=sys.stderr)
        for f in sorted(files):
            data = process_file(f)
            if data:
                results.append(data)
    elif target.is_file():
        data = process_file(target)
        if data:
            results = [data]
    else:
        print(f"Finn ekki: {target}", file=sys.stderr)
        sys.exit(1)

    output = json.dumps(results, ensure_ascii=False, indent=2)

    if len(sys.argv) > 2:
        out_path = Path(sys.argv[2])
        out_path.write_text(output, encoding="utf-8")
        print(f"Skrifaði {len(results)} fundargerðir í {out_path}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
