/**
 * Compute statistics from parsed Hinge data
 */

import type { ParsedHingeData, HingeStats } from './types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMessageDate(msg: { timestamp?: string; created_at?: string }): Date | null {
  const ts = msg.timestamp || msg.created_at;
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function isFromUser(msg: { from?: string; sender?: string }): boolean {
  const from = (msg.from || msg.sender || '').toLowerCase();
  return from === 'you' || from === 'me' || from === 'self' || from === '';
}

export function computeStats(data: ParsedHingeData): HingeStats {
  const { matches, messages, likes, matchTimestamps } = data;

  const totalMatches = matches.length;
  const sent = messages.filter(isFromUser);
  const received = messages.filter((m) => !isFromUser(m));
  const totalMessagesSent = sent.length;
  const totalMessagesReceived = received.length;

  // Longest conversation (by message count per match)
  let longestConversation = { days: 0, matchName: '' };
  for (const match of matches) {
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

  // Average response time (simplified: time between consecutive messages)
  let totalResponseTime = 0;
  let responseCount = 0;
  for (const match of matches) {
    const msgs = (match.messages || []).sort(
      (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    for (let i = 1; i < msgs.length; i++) {
      const prev = getMessageDate(msgs[i - 1]);
      const curr = getMessageDate(msgs[i]);
      if (prev && curr) {
        const diffHours = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60);
        totalResponseTime += diffHours;
        responseCount++;
      }
    }
  }
  const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

  // Most active day of week
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

  // Most active hour
  const hourCounts: Record<number, number> = {};
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) {
      const h = d.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    }
  }
  const mostActiveHourNum = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 20;
  const mostActiveTimeOfDay = `${mostActiveHourNum}:00`;

  // Match rate (matches / likes if we have likes)
  const totalLikes = likes?.length || totalMatches * 2; // rough estimate
  const matchRate = totalLikes > 0 ? Math.round((totalMatches / totalLikes) * 100) : 50;

  // Message to match ratio
  const totalMessages = totalMessagesSent + totalMessagesReceived;
  const messageToMatchRatio = totalMatches > 0 ? (totalMessages / totalMatches).toFixed(1) : 0;

  // Longest streak (consecutive days with messages)
  const messageDates = messages
    .map((m) => getMessageDate(m))
    .filter((d): d is Date => d !== null)
    .map((d) => d.toDateString());
  const uniqueDates = Array.from(new Set(messageDates)).sort();
  let longestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]).getTime();
    const curr = new Date(uniqueDates[i]).getTime();
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = uniqueDates.length > 0 ? Math.max(longestStreak, currentStreak) : 0;

  // Ghosted (matches with no reply after last message from user)
  let ghostedConversations = 0;
  for (const match of matches) {
    const msgs = match.messages || [];
    if (msgs.length === 0) continue;
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    const last = sorted[sorted.length - 1];
    if (isFromUser(last)) ghostedConversations++;
  }

  // Fastest reply (minutes)
  let fastestReply = Infinity;
  for (const match of matches) {
    const msgs = (match.messages || []).sort(
      (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    for (let i = 1; i < msgs.length; i++) {
      const prev = getMessageDate(msgs[i - 1]);
      const curr = getMessageDate(msgs[i]);
      if (prev && curr && !isFromUser(msgs[i])) {
        const diffMins = (curr.getTime() - prev.getTime()) / (1000 * 60);
        if (diffMins < fastestReply && diffMins > 0) fastestReply = diffMins;
      }
    }
  }
  if (fastestReply === Infinity) fastestReply = 0;

  // Rizz score: based on response rate, match rate, message engagement
  const responseRate = totalMessagesReceived > 0 ? (totalMessagesSent / totalMessagesReceived) * 100 : 50;
  const engagementScore = totalMatches > 0 ? Math.min(100, (totalMessages / totalMatches) * 2) : 50;
  const rizzScore = Math.round(
    Math.min(100, (responseRate * 0.3 + engagementScore * 0.4 + matchRate * 0.3))
  );

  // Most used opener (first message)
  const openers: Record<string, number> = {};
  for (const match of matches) {
    const msgs = match.messages || [];
    const firstFromUser = msgs.find((m) => isFromUser(m));
    if (firstFromUser?.body) {
      const opener = firstFromUser.body.slice(0, 50).trim() || '(empty)';
      openers[opener] = (openers[opener] || 0) + 1;
    }
  }
  const mostUsedOpener =
    Object.entries(openers).sort((a, b) => b[1] - a[1])[0]?.[0]?.slice(0, 40) || "Hey!";

  // Most active month
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

  // Messages by day (for heatmap)
  const messagesByDay: Record<string, number> = {};
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) {
      const key = d.toISOString().slice(0, 10);
      messagesByDay[key] = (messagesByDay[key] || 0) + 1;
    }
  }

  // Messages by hour
  const messagesByHour: Record<number, number> = {};
  for (let h = 0; h < 24; h++) messagesByHour[h] = 0;
  for (const msg of messages) {
    const d = getMessageDate(msg);
    if (d) {
      messagesByHour[d.getHours()] = (messagesByHour[d.getHours()] || 0) + 1;
    }
  }

  // Matches by month
  const matchesByMonth: Record<string, number> = {};
  for (const m of matchTimestamps) {
    const key = `${m.timestamp.getFullYear()}-${String(m.timestamp.getMonth() + 1).padStart(2, '0')}`;
    matchesByMonth[key] = (matchesByMonth[key] || 0) + 1;
  }

  return {
    totalMatches,
    totalMessagesSent,
    totalMessagesReceived,
    longestConversation,
    averageResponseTime,
    mostActiveDayOfWeek,
    mostActiveTimeOfDay,
    matchRate,
    messageToMatchRatio: parseFloat(String(messageToMatchRatio)),
    longestStreak,
    ghostedConversations,
    fastestReply: Math.round(fastestReply),
    rizzScore,
    mostUsedOpener,
    mostActiveMonth,
    messagesByDay,
    messagesByHour,
    matchesByMonth,
  };
}
