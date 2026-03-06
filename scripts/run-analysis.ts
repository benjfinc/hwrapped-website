/**
 * Run Hinge data analysis - outputs stats to console
 * Usage: npx tsx scripts/run-analysis.ts [path-to-data.json]
 * If no path given, uses mock data
 */

import { readFileSync, existsSync } from 'fs';
import { parseHingeJson } from '../src/lib/data-parser';
import { computeStats } from '../src/lib/compute-stats';
import { MOCK_HINGE_DATA } from '../src/lib/mock-data';

async function main() {
  const dataPath = process.argv[2];
  let parsed;

  if (dataPath && existsSync(dataPath)) {
    const raw = JSON.parse(readFileSync(dataPath, 'utf-8'));
    parsed = parseHingeJson(Array.isArray(raw) ? { matches: raw } : raw);
    console.log('--- Parsed from:', dataPath, '---\n');
  } else {
    parsed = MOCK_HINGE_DATA;
    console.log('--- Using MOCK data ---\n');
  }

  const stats = computeStats(parsed);

  console.log('=== ANALYSIS RESULTS ===\n');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log('Total likes/interactions:', stats.totalLikes);
  console.log('Total matches:', stats.totalMatches);
  console.log('Chats started:', stats.totalConversations);
  console.log('Match rate from likes:', stats.matchRateFromLikes.toFixed(1) + '%');
  console.log('Conversation rate from matches:', stats.conversationRate.toFixed(1) + '%');
  console.log('Total messages:', stats.totalMessages);
  console.log('Longest conversation:', stats.longestConversation.days, 'days', stats.longestConversation.matchName ? `(with ${stats.longestConversation.matchName})` : '');
  console.log('Most active month:', stats.mostActiveMonth);
  console.log('Most active day:', stats.mostActiveDayOfWeek);
  console.log('Most active hour:', stats.mostActiveTimeOfDay);
  console.log('Most used opener:', stats.mostUsedOpener);
  if (stats.accountAgeDays) {
    console.log('Account age:', Math.round(stats.accountAgeDays / 30), 'months');
  }
}

main().catch(console.error);
