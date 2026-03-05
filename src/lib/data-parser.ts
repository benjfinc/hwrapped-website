/**
 * Parser for Hinge data export
 * Handles both JSON and ZIP formats
 * Full extraction from all export files: matches, user, media, prompts, prompt_feedback, convo_starters
 */

import type { HingeMatch, HingeMessage, ParsedHingeData, HingeMedia, HingePrompt, HingePromptFeedback, HingeConvoStarter } from './types';

/** Parse Hinge timestamp formats: "2025-03-02 14:46:22" or ISO */
function parseTimestamp(ts: string): Date | null {
  if (!ts) return null;
  const d = new Date(String(ts).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Extract messages from match objects - handles various Hinge export structures
 * Real Hinge export uses "chats" and has no from/sender (only your messages for privacy)
 */
function extractMessagesFromMatches(matches: HingeMatch[]): HingeMessage[] {
  const messages: HingeMessage[] = [];

  for (const match of matches) {
    const matchObj = match as unknown as Record<string, unknown>;
    const matchMessages =
      match.messages ||
      matchObj.chat ||
      matchObj.chats ||
      matchObj.messages ||
      (match as unknown as { Chats?: HingeMessage[] }).Chats;
    if (Array.isArray(matchMessages)) {
      for (const msg of matchMessages) {
        const msgObj = msg as Record<string, unknown>;
        const ts = msgObj.timestamp || msgObj.created_at || msgObj.CreatedAt;
        const from = msgObj.from ?? msgObj.sender ?? msgObj.Sender;
        messages.push({
          ...msg,
          timestamp: ts,
          from: from !== undefined && from !== null ? from : 'you',
        });
      }
    }
  }

  return messages;
}

/** Normalize raw record - matches Hinge export: like, match, block, chats */
function normalizeMatch(raw: unknown, index: number): HingeMatch & { hasMatch?: boolean; hasChats?: boolean } {
  const m = raw as Record<string, unknown>;
  const chats = m.chats ?? m.chat ?? m.messages ?? m.Chats;
  const matchArr = m.match;
  const hasMatch = Array.isArray(matchArr) && matchArr.length > 0;
  const hasChats = Array.isArray(chats) && chats.length > 0;
  const matchTs = hasMatch && matchArr[0] && typeof matchArr[0] === 'object'
    ? (matchArr[0] as { timestamp?: string }).timestamp
    : m.timestamp ?? m.created_at ?? m.match_date;
  return {
    match_id: String(m.match_id ?? m.id ?? `record-${index}`),
    name: (m.name as string) ?? 'Someone',
    timestamp: matchTs as string,
    created_at: matchTs as string,
    messages: Array.isArray(chats) ? (chats as HingeMessage[]).map((msg) => {
      const msgObj = msg as Record<string, unknown>;
      const ts = msgObj.timestamp ?? msgObj.created_at;
      return {
        ...msg,
        timestamp: (typeof ts === 'string' ? ts.replace(' ', 'T') : undefined) as string | undefined,
        from: (msgObj.from ?? msgObj.sender ?? 'you') as string,
      } as HingeMessage;
    }) : [],
    hasMatch,
    hasChats,
  } as HingeMatch & { hasMatch?: boolean; hasChats?: boolean };
}

/**
 * Parse matches.json - handles root array or { matches: [...] }
 * Correct formulas per Hinge export: matches = records where match.length > 0
 */
export function parseMatchesJson(data: unknown): Pick<ParsedHingeData, 'interactionRecords' | 'matches' | 'conversations' | 'messages' | 'matchTimestamps'> {
  const result = {
    interactionRecords: [] as HingeMatch[],
    matches: [] as HingeMatch[],
    conversations: [] as HingeMatch[],
    messages: [] as HingeMessage[],
    matchTimestamps: [] as ParsedHingeData['matchTimestamps'],
  };

  if (!data || typeof data !== 'object') return result;

  const dataObj = data as Record<string, unknown>;
  let rawRecords: unknown[] = [];

  if (Array.isArray(data)) {
    rawRecords = data;
  } else if (dataObj.matches || dataObj.Matches) {
    rawRecords = (dataObj.matches || dataObj.Matches) as unknown[];
  }
  if (!Array.isArray(rawRecords)) rawRecords = [];

  const allRecords = rawRecords.map((m, i) => normalizeMatch(m, i)) as (HingeMatch & { hasMatch?: boolean; hasChats?: boolean })[];
  const matches = allRecords.filter((r) => r.hasMatch) as HingeMatch[];
  const conversations = allRecords.filter((r) => r.hasChats) as HingeMatch[];

  result.interactionRecords = allRecords;
  result.matches = matches;
  result.conversations = conversations;
  result.messages = extractMessagesFromMatches(conversations);

  for (const match of matches) {
    const ts = match.timestamp || match.created_at || match.match_date;
    if (ts) {
      const date = parseTimestamp(ts);
      if (date) {
        result.matchTimestamps.push({
          matchId: match.match_id || match.id || String(Math.random()),
          timestamp: date,
        });
      }
    }
  }

  return result;
}

/**
 * Parse raw JSON - single file (matches or wrapper)
 */
export function parseHingeJson(data: unknown): ParsedHingeData {
  const parsed: ParsedHingeData = {
    interactionRecords: [],
    matches: [],
    conversations: [],
    messages: [],
    likes: [],
    matchTimestamps: [],
  };

  if (!data || typeof data !== 'object') return parsed;

  const dataObj = data as Record<string, unknown>;

  const matchData = parseMatchesJson(data);
  parsed.interactionRecords = matchData.interactionRecords;
  parsed.matches = matchData.matches;
  parsed.conversations = matchData.conversations;
  parsed.messages = matchData.messages;
  parsed.matchTimestamps = matchData.matchTimestamps;

  const likes = (dataObj.likes || dataObj.Likes || []) as { timestamp?: string }[];
  if (Array.isArray(likes)) {
    parsed.likes = likes.filter((l) => l?.timestamp).map((l) => ({ timestamp: l.timestamp! }));
  }

  if (dataObj.user && typeof dataObj.user === 'object') {
    parsed.user = dataObj.user as ParsedHingeData['user'];
  }

  return parsed;
}

/**
 * Parse full Hinge ZIP - extracts and parses ALL JSON files
 */
export async function parseHingeZip(file: File): Promise<ParsedHingeData> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const merged: ParsedHingeData = {
    interactionRecords: [],
    matches: [],
    conversations: [],
    messages: [],
    likes: [],
    matchTimestamps: [],
  };

  const jsonFiles = Object.keys(zip.files).filter((f) => f.toLowerCase().endsWith('.json'));

  for (const path of jsonFiles) {
    const fileEntry = zip.file(path);
    if (!fileEntry) continue;

    try {
      const content = await fileEntry.async('string');
      const data = JSON.parse(content);
      const baseName = path.split('/').pop()?.toLowerCase() || path.toLowerCase();

      if (baseName === 'matches.json') {
        const matchData = parseMatchesJson(data);
        merged.interactionRecords = matchData.interactionRecords;
        merged.matches = matchData.matches;
        merged.conversations = matchData.conversations;
        merged.messages = matchData.messages;
        merged.matchTimestamps = matchData.matchTimestamps;
      } else if (baseName === 'user.json') {
        merged.user = data as ParsedHingeData['user'];
      } else if (baseName === 'media.json') {
        merged.media = Array.isArray(data) ? data : [];
      } else if (baseName === 'prompts.json') {
        merged.prompts = Array.isArray(data) ? data : [];
      } else if (baseName === 'prompt_feedback.json') {
        merged.promptFeedback = Array.isArray(data) ? data : [];
      } else if (baseName === 'convo_starters.json') {
        merged.convoStarters = Array.isArray(data) ? data : [];
      }
    } catch {
      // Skip unparseable files
    }
  }

  return merged;
}

/**
 * Parse uploaded file - single JSON or full ZIP
 */
export async function parseHingeFile(file: File): Promise<ParsedHingeData> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.zip')) {
    return parseHingeZip(file);
  }

  if (name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    const baseName = name;

    if (baseName.includes('match')) {
      return parseHingeJson(Array.isArray(data) ? data : data);
    }
    const empty = { interactionRecords: [], matches: [], conversations: [], messages: [], likes: [], matchTimestamps: [] };
    if (baseName.includes('user')) {
      return { ...empty, user: data };
    }
    if (baseName.includes('media')) {
      return { ...empty, media: Array.isArray(data) ? data : [] };
    }
    if (baseName.includes('prompt')) {
      const isFeedback = baseName.includes('feedback');
      return {
        ...empty,
        ...(isFeedback ? { promptFeedback: Array.isArray(data) ? data : [] } : { prompts: Array.isArray(data) ? data : [] }),
      };
    }
    if (baseName.includes('convo')) {
      return { ...empty, convoStarters: Array.isArray(data) ? data : [] };
    }

    return parseHingeJson(Array.isArray(data) ? data : data);
  }

  throw new Error('Please upload a JSON or ZIP file from your Hinge data export');
}

/**
 * Merge multiple ParsedHingeData (e.g. when user uploads multiple files)
 */
export function mergeParsedData(...datas: ParsedHingeData[]): ParsedHingeData {
  const merged: ParsedHingeData = {
    interactionRecords: [],
    matches: [],
    conversations: [],
    messages: [],
    likes: [],
    matchTimestamps: [],
  };

  for (const d of datas) {
    if (d.interactionRecords?.length) {
      merged.interactionRecords = d.interactionRecords;
      merged.matches = d.matches;
      merged.conversations = d.conversations;
      merged.messages = d.messages;
      merged.matchTimestamps = d.matchTimestamps;
    }
    if (d.user) merged.user = d.user;
    if (d.media?.length) merged.media = d.media;
    if (d.prompts?.length) merged.prompts = d.prompts;
    if (d.promptFeedback?.length) merged.promptFeedback = d.promptFeedback;
    if (d.convoStarters?.length) merged.convoStarters = d.convoStarters;
    if (d.likes?.length) merged.likes = d.likes;
  }

  return merged;
}
