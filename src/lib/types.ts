/**
 * Type definitions for Hinge data export
 * Hinge exports data as ZIP containing JSON files in data/export/ structure
 */

export interface HingeMatch {
  match_id?: string;
  id?: string;
  name?: string;
  timestamp?: string;
  created_at?: string;
  match_date?: string;
  messages?: HingeMessage[];
  like?: { timestamp?: string };
  we_met?: { timestamp?: string };
}

export interface HingeMessage {
  id?: string;
  timestamp?: string;
  created_at?: string;
  body?: string;
  from?: string;
  to?: string;
  sender?: string;
}

export interface HingeUser {
  user_id?: string;
  name?: string;
  birth_date?: string;
  gender?: string;
  city?: string;
  school?: string;
}

export interface HingeExport {
  matches?: HingeMatch[];
  user?: HingeUser;
  likes?: unknown[];
  media?: unknown[];
  prompts?: unknown[];
}

export interface ParsedHingeData {
  matches: HingeMatch[];
  messages: HingeMessage[];
  likes: { timestamp: string }[];
  user?: HingeUser;
  matchTimestamps: { matchId: string; timestamp: Date }[];
}

export interface HingeStats {
  totalMatches: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  longestConversation: { days: number; matchName?: string };
  averageResponseTime: number; // in hours
  mostActiveDayOfWeek: string;
  mostActiveTimeOfDay: string;
  matchRate: number; // percentage
  messageToMatchRatio: number;
  longestStreak: number; // days
  ghostedConversations: number;
  fastestReply: number; // minutes
  rizzScore: number; // 0-100
  mostUsedOpener: string;
  mostActiveMonth: string;
  messagesByDay: Record<string, number>;
  messagesByHour: Record<number, number>;
  matchesByMonth: Record<string, number>;
}

export interface SlideData {
  id: string;
  title: string;
  stat: string | number;
  subtitle?: string;
  chartType?: 'bar' | 'pie' | 'heatmap' | 'timeline' | 'none';
  chartData?: unknown;
}
