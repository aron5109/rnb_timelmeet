import { MeetingListItem } from './types';

const BASE_URL = 'https://www.reykjanesbaer.is';
const LIST_URL = `${BASE_URL}/is/stjornsysla/stjornsyslan/fundargerdir/baejarstjorn`;

export async function fetchMeetingList(limit = 20): Promise<MeetingListItem[]> {
  const res = await fetch(LIST_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RNB-Timalina/1.0)' },
    next: { revalidate: 3600 }, // cache 1 hour
  });
  const html = await res.text();

  // Parse the meeting links using regex (no cheerio on edge)
  const meetings: MeetingListItem[] = [];
  
  // Match links with meeting info - pattern: href="/is/...baejarstjorn/XXX"
  const linkPattern = /href="(\/is\/stjornsysla\/stjornsyslan\/fundargerdir\/baejarstjorn\/[^"]+)"[^>]*>\s*\n?\s*Bæjarstjórn\s*\n\s*([^\n]+)\s*\n\s*([^\n<]+)/gim;
  
  // Simpler approach: extract all the meeting anchor blocks
  const blockPattern = /\[Bæjarstjórn\s*\n([^\n]+)\n([^\]]+)\]\((https?:\/\/[^\)]+|\/[^\)]+)\)/gim;
  
  let match;
  while ((match = blockPattern.exec(html)) !== null && meetings.length < limit) {
    const number = match[1].trim();
    const date = match[2].trim();
    let url = match[3].trim();
    if (url.startsWith('/')) url = BASE_URL + url;
    
    meetings.push({
      title: `Bæjarstjórn - ${number}`,
      number: number,
      date: parseIcelandicDate(date),
      url,
    });
  }

  // If regex didn't work well, try a direct HTML parse approach
  if (meetings.length === 0) {
    // Extract from <a href> tags in the table
    const rowPattern = /href="(\/is\/stjornsysla\/stjornsyslan\/fundargerdir\/baejarstjorn\/[^"]+)"/g;
    const urlSet = new Set<string>();
    while ((match = rowPattern.exec(html)) !== null) {
      urlSet.add(match[1]);
    }
    
    // Also extract date/title pairs from the page content
    const contentPattern = /Bæjarstjórn\s*\n([^\n]+fundur[^\n]*)\n([^\n]+\d{4})/gim;
    const pairs: Array<{number: string, date: string}> = [];
    while ((match = contentPattern.exec(html)) !== null) {
      pairs.push({ number: match[1].trim(), date: match[2].trim() });
    }
    
    const urls = Array.from(urlSet).slice(0, limit);
    urls.forEach((path, i) => {
      const pair = pairs[i] || { number: `Fundur ${i+1}`, date: '' };
      meetings.push({
        title: `Bæjarstjórn - ${pair.number}`,
        number: pair.number,
        date: pair.date ? parseIcelandicDate(pair.date) : '',
        url: BASE_URL + path,
      });
    });
  }

  return meetings.slice(0, limit);
}

export async function fetchMeetingContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RNB-Timalina/1.0)' },
  });
  const html = await res.text();
  
  // Extract the main content - find the #main section
  const mainMatch = html.match(/<main[^>]*id="main"[^>]*>([\s\S]+?)<\/main>/i) ||
                    html.match(/class="[^"]*content[^"]*"[^>]*>([\s\S]+?)<\/div>/i);
  
  let content = mainMatch ? mainMatch[1] : html;
  
  // Strip HTML tags but preserve structure
  content = content
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#[0-9]+;/g, '')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
  
  return content;
}

function parseIcelandicDate(dateStr: string): string {
  const months: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'maí': '05', 'jún': '06', 'júl': '07', 'ágú': '08',
    'sep': '09', 'okt': '10', 'nóv': '11', 'des': '12',
  };
  
  const clean = dateStr.toLowerCase().replace(/\./g, '').trim();
  const parts = clean.split(/\s+/);
  
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monthKey = parts[1].substring(0, 3);
    const year = parts[2] || new Date().getFullYear().toString();
    const month = months[monthKey] || '01';
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}
