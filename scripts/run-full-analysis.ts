/**
 * Run full Hinge data analysis from a directory of export files
 * Usage: npx tsx scripts/run-full-analysis.ts /path/to/export/folder
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseHingeFile, mergeParsedData } from '../src/lib/data-parser';
import { computeStats } from '../src/lib/compute-stats';
import type { ParsedHingeData } from '../src/lib/types';

async function main() {
  const dir = process.argv[2] || '/home/ubuntu/.cursor/projects/workspace/uploads';
  if (!existsSync(dir)) {
    console.error('Directory not found:', dir);
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  console.log('Found files:', files.join(', '));
  console.log('');

  const parsed: ParsedHingeData[] = [];

  for (const f of files) {
    const path = join(dir, f);
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      const baseName = f.toLowerCase();

      if (baseName === 'matches.json') {
        const { parseHingeJson } = await import('../src/lib/data-parser');
        parsed.push(parseHingeJson(Array.isArray(data) ? data : data));
      } else if (baseName === 'user.json') {
        parsed.push({
          interactionRecords: [],
          matches: [],
          conversations: [],
          messages: [],
          likes: [],
          matchTimestamps: [],
          user: data,
        });
      } else if (baseName === 'media.json') {
        parsed.push({
          interactionRecords: [],
          matches: [],
          conversations: [],
          messages: [],
          likes: [],
          matchTimestamps: [],
          media: Array.isArray(data) ? data : [],
        });
      } else if (baseName === 'prompts.json') {
        parsed.push({
          interactionRecords: [],
          matches: [],
          conversations: [],
          messages: [],
          likes: [],
          matchTimestamps: [],
          prompts: Array.isArray(data) ? data : [],
        });
      } else if (baseName === 'prompt_feedback.json') {
        parsed.push({
          interactionRecords: [],
          matches: [],
          conversations: [],
          messages: [],
          likes: [],
          matchTimestamps: [],
          promptFeedback: Array.isArray(data) ? data : [],
        });
      } else if (baseName === 'convo_starters.json') {
        parsed.push({
          interactionRecords: [],
          matches: [],
          conversations: [],
          messages: [],
          likes: [],
          matchTimestamps: [],
          convoStarters: Array.isArray(data) ? data : [],
        });
      }
    } catch (e) {
      console.warn('Skip', f, ':', (e as Error).message);
    }
  }

  const merged = mergeParsedData(...parsed);
  const stats = computeStats(merged);

  console.log('=== FULL EXTRACTION ===\n');
  console.log('Interaction records:', merged.interactionRecords?.length ?? merged.matches?.length ?? 0);
  console.log('Matches (mutual):', merged.matches.length);
  console.log('Conversations:', merged.conversations.length);
  console.log('Messages:', merged.messages.length);
  console.log('User:', merged.user ? 'Yes' : 'No');
  console.log('Media:', merged.media?.length ?? 0);
  console.log('Prompts:', merged.prompts?.length ?? 0);
  console.log('Prompt feedback:', merged.promptFeedback?.length ?? 0);
  console.log('Convo starters:', merged.convoStarters?.length ?? 0);
  console.log('');

  console.log('=== COMPUTED STATS ===\n');
  console.log(JSON.stringify(stats, null, 2));
  console.log('');

  console.log('=== SUMMARY ===');
  console.log('Total records:', stats.totalRecords);
  console.log('Matches:', stats.totalMatches);
  console.log('Conversations:', stats.totalConversations);
  console.log('Likes only:', stats.likesOnly);
  console.log('Matches without messages:', stats.matchesWithoutMessages);
  console.log('Total messages:', stats.totalMessages);
  console.log('Conversation rate:', stats.conversationRate.toFixed(1) + '%');
  console.log('Avg messages/convo:', stats.avgMessagesPerConversation.toFixed(1));
  console.log('Longest convo (msgs):', stats.longestConversationMessages);
  console.log('Longest match streak:', stats.longestMatchStreak);
  if (stats.profileName) console.log('Profile:', stats.profileName, stats.profileAge ? `(${stats.profileAge})` : '');
  if (stats.signupDate) console.log('Joined:', stats.signupDate);
  if (stats.accountAgeDays) console.log('Account age:', Math.round(stats.accountAgeDays / 30), 'months');
  if (stats.totalPhotos) console.log('Photos:', stats.totalPhotos);
  if (stats.totalPrompts) console.log('Prompts:', stats.totalPrompts);
  console.log('Most used opener:', stats.mostUsedOpener);
  console.log('Most active day:', stats.mostActiveDayOfWeek);
  console.log('Most active hour:', stats.mostActiveTimeOfDay);
}

main().catch(console.error);
