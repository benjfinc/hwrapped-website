/**
 * Mock Hinge data for development and demo
 */

import type { ParsedHingeData } from './types';

const DAYS_AGO = (d: number, hour?: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  if (hour !== undefined) {
    date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  }
  return date.toISOString();
};

const mockMatches = Array.from({ length: 142 }, (_, i) => {
    const baseDays = 30 + Math.floor(Math.random() * 60);
    const msgCount = Math.floor(Math.random() * 50) + 1;
    return {
      match_id: `match-${i}`,
      name: `Match ${i + 1}`,
      timestamp: DAYS_AGO(Math.floor(Math.random() * 365)),
      messages: Array.from({ length: msgCount }, (_, j) => ({
        id: `msg-${i}-${j}`,
        // msg 0 is oldest (first in convo): baseDays + (msgCount-1-j) so j=0 has largest
        timestamp: DAYS_AGO(baseDays + (msgCount - 1 - j), Math.floor(Math.random() * 24)),
        body: j === 0 ? ['Hey!', 'Hi there!', 'Hello!', "What's up?", 'Hey, how are you!'][i % 5] : `Message ${j + 1}`,
        from: j % 2 === 0 ? 'you' : 'them',
      })),
    };
  });

export const MOCK_HINGE_DATA: ParsedHingeData = {
  user: {
    user_id: 'mock-user',
    name: 'You',
    gender: 'male',
    city: 'San Francisco',
  },
  interactionRecords: mockMatches,
  matches: mockMatches,
  conversations: mockMatches.filter((m) => (m.messages || []).length > 0),
  messages: [],
  likes: Array.from({ length: 89 }, (_, i) => ({
    timestamp: DAYS_AGO(Math.floor(Math.random() * 365)),
  })),
  matchTimestamps: mockMatches
    .filter((m) => m.timestamp)
    .map((m) => ({ matchId: m.match_id || '', timestamp: new Date(m.timestamp!) })),
};

MOCK_HINGE_DATA.messages = MOCK_HINGE_DATA.conversations.flatMap((m) =>
  (m.messages || []).map((msg) => ({
    ...msg,
    timestamp: msg.timestamp || msg.created_at,
  }))
);
