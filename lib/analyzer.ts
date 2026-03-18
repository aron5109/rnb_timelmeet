import Anthropic from '@anthropic-ai/sdk';
import { TimelineData, TimelineEvent, MeetingListItem } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeMeetingsToTimeline(
  meetings: Array<{ item: MeetingListItem; content: string }>
): Promise<TimelineData> {
  const meetingsText = meetings.map(({ item, content }) => 
    `=== ${item.title} (${item.date}) ===\nURL: ${item.url}\n\n${content.substring(0, 3000)}`
  ).join('\n\n---\n\n');

  const prompt = `Þú ert sérfræðingur í greiningu fundargerða sveitarfélaga. Greindu eftirfarandi fundargerðir bæjarstjórnar Reykjanesbæjar og búðu til skipulagðar tímalínugögn á JSON sniði.

FUNDARGERÐIR:
${meetingsText}

Skilaðu EINUNGIS gildum JSON hlut með þessari nákvæmu uppbyggingu (ekkert annað texti):

{
  "metadata": {
    "title": "Fundargerðir bæjarstjórnar Reykjanesbæjar",
    "period": "YYYY – YYYY",
    "event_count": 0,
    "documents_processed": ${meetings.length},
    "created": "${new Date().toISOString()}",
    "issues": ["málefni1", "málefni2"],
    "gaps": [],
    "summary": "2-3 setningar um helstu mál sem komu upp á fundunum"
  },
  "entities": {
    "people": ["Nafn1", "Nafn2"],
    "organizations": ["Stofnun1"]
  },
  "categories": ["administrative", "financial"],
  "events": [
    {
      "id": "EVT-001",
      "date": "YYYY-MM-DD",
      "precision": "day",
      "evidence_type": "fact",
      "title": "Stutt lýsing á því sem gerðist",
      "summary": "1-2 setningar með nákvæmum upplýsingum",
      "people": ["Nafn bæjarfulltrúa"],
      "organizations": ["Reykjanesbær"],
      "category": "administrative",
      "issues": ["málefni"],
      "source": "Fundarnúmer",
      "source_url": "https://...",
      "meeting_number": "715",
      "corroboration_count": 1,
      "vote": "11-0 samþykkt"
    }
  ],
  "obligations": []
}

Reglur:
- date: ISO snið YYYY-MM-DD
- evidence_type: "fact" fyrir samþykktar fundargerðir, "assertion" fyrir bókanir
- category: "administrative" (stjórnsýsla), "financial" (fjármál), "regulatory" (reglugerðir), "communication" (samskipti), "legal-action" (réttaraðgerð), "investigation" (rannsókn), "contract" (samningur)
- Allt efni á ÍSLENSKU
- Hvert mál á fundi er einn atburður
- Láttu vote vera atkvæðagreiðsluna ef hún kemur fram`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]+\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');
  
  const data = JSON.parse(jsonMatch[0]) as TimelineData;
  
  // Ensure event count is accurate
  data.metadata.event_count = data.events.length;
  
  return data;
}
