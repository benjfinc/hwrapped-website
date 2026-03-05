/**
 * Parser for Hinge data export
 * Handles both JSON and ZIP formats
 */

import type { HingeMatch, HingeMessage, ParsedHingeData } from './types';

/**
 * Extract messages from match objects - handles various Hinge export structures
 */
function extractMessagesFromMatches(matches: HingeMatch[]): HingeMessage[] {
  const messages: HingeMessage[] = [];

  for (const match of matches) {
    const matchMessages = match.messages || (match as unknown as { chat?: HingeMessage[] }).chat;
    if (Array.isArray(matchMessages)) {
      for (const msg of matchMessages) {
        messages.push({
          ...msg,
          timestamp: msg.timestamp || msg.created_at,
        });
      }
    }
  }

  return messages;
}

/**
 * Parse raw JSON data from Hinge export
 */
export function parseHingeJson(data: unknown): ParsedHingeData {
  const parsed: ParsedHingeData = {
    matches: [],
    messages: [],
    likes: [],
    matchTimestamps: [],
  };

  if (!data || typeof data !== 'object') {
    return parsed;
  }

  const dataObj = data as Record<string, unknown>;

  // Handle different export structures
  // Structure 1: { matches: [...] }
  let matches = (dataObj.matches || dataObj.Matches || []) as HingeMatch[];

  // Structure 2: Nested in export folder structure
  const exportData = dataObj.export || dataObj.data;
  if (exportData && typeof exportData === 'object') {
    const exportObj = exportData as Record<string, unknown>;
    matches = (exportObj.matches || exportObj.Matches || matches) as HingeMatch[];
  }

  // Ensure matches is array
  if (!Array.isArray(matches)) {
    matches = [];
  }

  parsed.matches = matches;

  // Extract messages
  parsed.messages = extractMessagesFromMatches(matches);

  // Extract likes
  const likes = (dataObj.likes || dataObj.Likes || []) as { timestamp?: string }[];
  if (Array.isArray(likes)) {
    parsed.likes = likes
      .filter((l) => l?.timestamp)
      .map((l) => ({ timestamp: l.timestamp! }));
  }

  // Build match timestamps
  for (const match of matches) {
    const ts =
      match.timestamp ||
      match.created_at ||
      match.match_date ||
      (match.like as { timestamp?: string })?.timestamp;
    if (ts) {
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        parsed.matchTimestamps.push({
          matchId: match.match_id || match.id || String(Math.random()),
          timestamp: date,
        });
      }
    }
  }

  // User info
  if (dataObj.user && typeof dataObj.user === 'object') {
    parsed.user = dataObj.user as ParsedHingeData['user'];
  }

  return parsed;
}

/**
 * Parse Hinge ZIP export - extracts and parses JSON files
 */
export async function parseHingeZip(file: File): Promise<ParsedHingeData> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const merged: ParsedHingeData = {
    matches: [],
    messages: [],
    likes: [],
    matchTimestamps: [],
  };

  // Look for matches.json - check common paths and any file ending with matches.json
  const matchPaths = [
    'matches.json',
    'Matches.json',
    'data/export/matches.json',
    'export/matches.json',
    ...Object.keys(zip.files).filter((f) => f.toLowerCase().endsWith('matches.json')),
  ];

  for (const path of matchPaths) {
    const matchFile = zip.file(path);
    if (matchFile) {
      const content = await matchFile.async('string');
      try {
        const data = JSON.parse(content);
        const parsed = parseHingeJson(data);
        if (Array.isArray(data)) {
          merged.matches = data as HingeMatch[];
          merged.messages = extractMessagesFromMatches(merged.matches);
        } else {
          Object.assign(merged, parseHingeJson(data));
        }
        break;
      } catch {
        // Try parsing as array directly
        try {
          const arr = JSON.parse(content);
          if (Array.isArray(arr)) {
            merged.matches = arr as HingeMatch[];
            merged.messages = extractMessagesFromMatches(merged.matches);
          }
          break;
        } catch {
          continue;
        }
      }
    }
  }

  // If no matches found, try any JSON file
  if (merged.matches.length === 0) {
    const jsonFiles = Object.keys(zip.files).filter((f) => f.endsWith('.json'));
    for (const f of jsonFiles) {
      const content = await zip.file(f)!.async('string');
      try {
        const data = JSON.parse(content);
        const parsed = parseHingeJson(Array.isArray(data) ? { matches: data } : data);
        if (parsed.matches.length > 0) {
          Object.assign(merged, parsed);
          break;
        }
      } catch {
        continue;
      }
    }
  }

  return merged;
}

/**
 * Parse uploaded file - detects JSON vs ZIP
 */
export async function parseHingeFile(file: File): Promise<ParsedHingeData> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.zip')) {
    return parseHingeZip(file);
  }

  if (name.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    return parseHingeJson(Array.isArray(data) ? { matches: data } : data);
  }

  throw new Error('Please upload a JSON or ZIP file from your Hinge data export');
}
