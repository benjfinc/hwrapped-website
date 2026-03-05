/**
 * Compute statistics from parsed Hinge data
 * Correct formulas per Hinge export structure:
 * - matches = records where match.length > 0
 * - conversations = records where chats.length > 0
 * - No sender IDs = cannot compute sent/received, ghosting, response time
 */

import type { ParsedHingeData, HingeStats } from './types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMessageDate(msg: { timestamp?: string; created_at?: string }): Date | null {
  const ts = msg.timestamp || msg.created_at;
  if (!ts) return null;
  const d = new Date(String(ts).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}

/** Extract emoji from text - matches common emoji ranges */
function extractEmojis(text: string): string[] {
  const matches: string[] = [];
  const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u203C-\u3299]/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

export function computeStats(data: ParsedHingeData): HingeStats {
  const {
    interactionRecords = [],
    matches = [],
    conversations = [],
    messages = [],
    matchTimestamps = [],
  } = data;

  // Use interactionRecords for backward compat if matches/conversations not set
  const records = interactionRecords.length > 0 ? interactionRecords : matches;
  const convos = conversations.length > 0 ? conversations : records.filter((r) => (r.messages || []).length > 0);
  const allMatches = matches.length > 0 ? matches : records.filter((r) => {
    const m = r as unknown as { match?: unknown[] };
    return m.match && Array.isArray(m.match) && m.match.length > 0;
  });

  const totalRecords = records.length;
  const totalMatches = allMatches.length;
  const totalConversations = convos.length;
  const matchesWithoutMessages = totalMatches - totalConversations;
  const likesOnly = totalRecords - totalMatches;
  const totalMessages = messages.length;

  const conversationRate = totalMatches > 0 ? (totalConversations / totalMatches) * 100 : 0;

  const msgCounts = convos.map((c) => (c.messages || []).length).filter((n) => n > 0).sort((a, b) => a - b);
  const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
  const medianMessagesPerConversation = msgCounts.length > 0 ? msgCounts[Math.floor(msgCounts.length / 2)] : 0;
  const longestConversationMessages = msgCounts.length > 0 ? Math.max(...msgCounts) : 0;

  let longestConversation = { days: 0, matchName: '' };
  for (const match of convos) {
    const msgs = match.messages || [];
    if (msgs.length < 2) continue;
    const dates = msgs
      .map((m) => getMessageDate(m))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length >= 2) {
      const days = Math.ceil((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));
      if (days > longestConversation.days) {
        longestConversation = { days, matchName: match.name || 'Someone' };
      }
    }
  }

  const dayCounts: Record<number, number> = {};
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) {
      const day = d.getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  }
  const mostActiveDayNum = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  const mostActiveDayOfWeek = DAYS[parseInt(mostActiveDayNum)] || 'Sunday';

  const hourCounts: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourCounts[h] = 0;
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) hourCounts[d.getHours()]++;
  }
  const mostActiveHourNum = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 17;
  const mostActiveTimeOfDay = `${mostActiveHourNum}:00`;

  const matchesByMonth: Record<string, number> = {};
  for (const m of matchTimestamps) {
    const key = `${m.timestamp.getFullYear()}-${String(m.timestamp.getMonth() + 1).padStart(2, '0')}`;
    matchesByMonth[key] = (matchesByMonth[key] || 0) + 1;
  }

  const matchDates = matchTimestamps.map((m) => m.timestamp.toISOString().slice(0, 10)).sort();
  let longestMatchStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < matchDates.length; i++) {
    const prev = new Date(matchDates[i - 1]).getTime();
    const curr = new Date(matchDates[i]).getTime();
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) currentStreak++;
    else {
      longestMatchStreak = Math.max(longestMatchStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestMatchStreak = matchDates.length > 0 ? Math.max(longestMatchStreak, currentStreak) : 0;

  const messagesByDay: Record<string, number> = {};
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) {
      const key = d.toISOString().slice(0, 10);
      messagesByDay[key] = (messagesByDay[key] || 0) + 1;
    }
  }

  const messagesByHour: Record<number, number> = {};
  for (let h = 0; h < 24; h++) messagesByHour[h] = 0;
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) messagesByHour[d.getHours()]++;
  }

  const monthCounts: Record<number, number> = {};
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) {
      const m = d.getMonth();
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    }
  }
  const mostActiveMonthNum = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? new Date().getMonth();
  const mostActiveMonth = MONTHS[parseInt(mostActiveMonthNum)] || MONTHS[new Date().getMonth()];

  const mostUsedOpener = (() => {
    const openers: Record<string, number> = {};
    for (const match of convos) {
      const msgs = (match.messages || []).sort(
        (a, b) => new Date(a.timestamp || a.created_at || 0).getTime() - new Date(b.timestamp || b.created_at || 0).getTime()
      );
      const first = msgs[0];
      if (first?.body) {
        const opener = first.body.slice(0, 50).trim() || '(empty)';
        openers[opener] = (openers[opener] || 0) + 1;
      }
    }
    return Object.entries(openers).sort((a, b) => b[1] - a[1])[0]?.[0]?.slice(0, 40) || 'Hey!';
  })();

  const allBodies = messages.map((m) => m.body || '').join(' ');
  const words = allBodies.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;
  const totalCharacters = allBodies.length;
  const avgWordsPerMessage = totalMessages > 0 ? totalWords / totalMessages : 0;
  const questionRate = totalMessages > 0
    ? (messages.filter((m) => (m.body || '').includes('?')).length / totalMessages) * 100
    : 0;

  const emojiCounts: Record<string, number> = {};
  for (const msg of messages) {
    const emojis = extractEmojis(msg.body || '');
    for (const e of emojis) {
      emojiCounts[e] = (emojiCounts[e] || 0) + 1;
    }
  }
  const topEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([emoji, count]) => ({ emoji, count }));

  const user = data.user as { profile?: { first_name?: string; age?: number }; account?: { signup_time?: string } } | undefined;
  const profile = user?.profile;
  const account = user?.account;
  const profileName = profile?.first_name;
  const profileAge = profile?.age;
  const signupTime = account?.signup_time;
  const signupDate = signupTime
    ? (() => {
        const d = new Date(signupTime.replace(' ', 'T'));
        return isNaN(d.getTime()) ? undefined : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      })()
    : undefined;
  const accountAgeDays = signupTime ? Math.floor((Date.now() - new Date(signupTime.replace(' ', 'T')).getTime()) / (1000 * 60 * 60 * 24)) : undefined;
  const totalPhotos = data.media?.length ?? 0;
  const totalPrompts = data.prompts?.length ?? 0;
  const topPrompt = data.prompts?.length
    ? (data.prompts as { prompt?: string; text?: string }[]).reduce(
        (best, p) => {
          const text = p.prompt || p.text || '';
          return text.length > (best?.length || 0) ? text : best;
        },
        '' as string
      )
    : undefined;

  return {
    totalRecords,
    totalMatches,
    totalConversations,
    matchesWithoutMessages,
    likesOnly,
    totalMessages,
    conversationRate,
    avgMessagesPerConversation,
    medianMessagesPerConversation,
    longestConversationMessages,
    longestConversation,
    mostActiveDayOfWeek,
    mostActiveTimeOfDay,
    matchesByMonth,
    longestMatchStreak,
    totalWords,
    totalCharacters,
    avgWordsPerMessage,
    questionRate,
    topEmojis,
    mostUsedOpener,
    mostActiveMonth,
    messagesByDay,
    messagesByHour,
    profileName,
    profileAge,
    signupDate,
    totalPhotos,
    totalPrompts,
    topPrompt: topPrompt?.slice(0, 50),
    accountAgeDays,
    totalMessagesSent: totalMessages,
    totalMessagesReceived: 0,
  };
}
