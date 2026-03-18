import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMeetingList, fetchMeetingContent } from '../../lib/scraper';
import { analyzeMeetingsToTimeline } from '../../lib/analyzer';
import { TimelineData } from '../../lib/types';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TimelineData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = Math.min(parseInt(req.query.limit as string || '10'), 20);

  try {
    // Step 1: Fetch meeting list
    const meetingList = await fetchMeetingList(limit);
    
    if (meetingList.length === 0) {
      return res.status(500).json({ error: 'Could not fetch meeting list' });
    }

    // Step 2: Fetch content for each meeting (limit to avoid timeout)
    const meetingsWithContent = await Promise.all(
      meetingList.slice(0, limit).map(async (item) => {
        try {
          const content = await fetchMeetingContent(item.url);
          return { item, content };
        } catch (e) {
          return { item, content: `Gat ekki sótt efni: ${item.url}` };
        }
      })
    );

    // Step 3: Analyze with Claude
    const timelineData = await analyzeMeetingsToTimeline(meetingsWithContent);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(timelineData);
  } catch (error) {
    console.error('Timeline API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
