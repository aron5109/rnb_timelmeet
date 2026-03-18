export interface TimelineEvent {
  id: string;
  date: string;
  precision: 'day' | 'month' | 'quarter' | 'year' | 'estimated';
  evidence_type: 'fact' | 'allegation' | 'assertion' | 'inference';
  title: string;
  summary: string;
  people: string[];
  organizations: string[];
  category: 'contract' | 'financial' | 'regulatory' | 'communication' | 'legal-action' | 'administrative' | 'investigation';
  issues: string[];
  source: string;
  source_url?: string;
  meeting_number?: string;
  corroboration_count: number;
  knowledge_event?: string;
  contradiction?: string | null;
  vote?: string;
}

export interface TimelineObligation {
  id: string;
  date: string;
  title: string;
  required_of: string;
  required_by: string;
  under: string;
  status: 'met' | 'missed' | 'unknown';
  source: string;
}

export interface TimelineGap {
  from: string;
  to: string;
  days: number;
}

export interface TimelineMetadata {
  title: string;
  period: string;
  event_count: number;
  documents_processed: number;
  created: string;
  issues: string[];
  gaps: TimelineGap[];
  summary: string;
}

export interface TimelineData {
  metadata: TimelineMetadata;
  entities: {
    people: string[];
    organizations: string[];
  };
  categories: string[];
  events: TimelineEvent[];
  obligations: TimelineObligation[];
}

export interface MeetingListItem {
  title: string;
  number: string;
  date: string;
  url: string;
}
