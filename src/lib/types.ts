/**
 * Type definitions for Hinge data export
 * Hinge exports data as ZIP containing JSON files
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
  profile?: {
    first_name?: string;
    age?: number;
    height_centimeters?: number;
    gender?: string;
    job_title?: string;
    schools?: string;
    hometowns?: string;
    dating_intention?: string;
    [key: string]: unknown;
  };
  preferences?: Record<string, unknown>;
  account?: {
    signup_time?: string;
    last_seen?: string;
    app_version?: string;
    [key: string]: unknown;
  };
  location?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HingeMedia {
  type?: string;
  url?: string;
  prompt?: string;
  caption?: string;
  from_social_media?: boolean;
}

export interface HingePrompt {
  id?: number;
  prompt?: string;
  type?: string;
  text?: string;
  options?: string[];
  created?: string;
  user_updated?: string;
}

export interface HingePromptFeedback {
  id?: number;
  timestamp?: string;
  hinge_prompt?: string;
  hinge_prompt_answer?: string;
}

export interface HingeConvoStarter {
  id?: number;
  prompt?: string;
  answer?: string;
  convo_starters_text?: string;
  photo_url?: string;
  updated_ts?: string;
}

export interface ParsedHingeData {
  /** All interaction records (likes + matches) */
  interactionRecords: HingeMatch[];
  /** Records where match.length > 0 (mutual likes) */
  matches: HingeMatch[];
  /** Records where chats.length > 0 */
  conversations: HingeMatch[];
  messages: HingeMessage[];
  likes: { timestamp: string }[];
  user?: HingeUser;
  matchTimestamps: { matchId: string; timestamp: Date }[];
  /** Full export - all parsed files */
  media?: HingeMedia[];
  prompts?: HingePrompt[];
  promptFeedback?: HingePromptFeedback[];
  convoStarters?: HingeConvoStarter[];
}

export interface HingeStats {
  /** Total interaction records (likes + matches) */
  totalRecords: number;
  /** Alias of totalRecords for clearer UI wording */
  totalLikes: number;
  /** Mutual likes (match.length > 0) */
  totalMatches: number;
  /** Records with messages (chats.length > 0) */
  totalConversations: number;
  /** Matches that never became conversations */
  matchesWithoutMessages: number;
  /** Likes that never matched */
  likesOnly: number;
  /** Messages in dataset (all from user - no sender IDs) */
  totalMessages: number;
  /** Match rate from all likes/interactions */
  matchRateFromLikes: number;
  /** Conversation rate: conversations / matches */
  conversationRate: number;
  /** Conversation rate from likes/interactions */
  conversationRateFromLikes: number;
  /** Avg messages per conversation */
  avgMessagesPerConversation: number;
  /** Median messages per conversation */
  medianMessagesPerConversation: number;
  /** Longest conversation by message count */
  longestConversationMessages: number;
  longestConversation: { days: number; matchName?: string };
  mostActiveDayOfWeek: string;
  mostActiveTimeOfDay: string;
  matchesByMonth: Record<string, number>;
  messagesByMonth: { month: string; count: number }[];
  topEmojis: { emoji: string; count: number }[];
  topWords: { word: string; count: number }[];
  /** Match streak: consecutive days with new matches */
  longestMatchStreak: number;
  mostUsedOpener: string;
  mostActiveMonth: string;
  messagesByDay: Record<string, number>;
  messagesByHour: Record<number, number>;
  /** Extended stats from full export */
  accountAgeDays?: number;
  /** Deprecated - no sender IDs in export */
  totalMessagesSent?: number;
  totalMessagesReceived?: number;
  averageResponseTime?: number;
  matchRate?: number;
  messageToMatchRatio?: number;
  longestStreak?: number;
  ghostedConversations?: number;
  fastestReply?: number;
  rizzScore?: number;
}

export interface SlideData {
  id: string;
  title: string;
  stat: string | number;
  subtitle?: string;
  chartType?: 'bar' | 'pie' | 'heatmap' | 'timeline' | 'none';
  chartData?: unknown;
}
