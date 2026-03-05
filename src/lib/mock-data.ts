/**
 * Mock Hinge data for development and demo
 */

import type { ParsedHingeData } from './types';

const DAYS_AGO = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
};

export const MOCK_HINGE_DATA: ParsedHingeData = {
  user: {
    user_id: 'mock-user',
    name: 'You',
    gender: 'male',
    city: 'San Francisco',
  },
  matches: Array.from({ length: 142 }, (_, i) => ({
    match_id: `match-${i}`,
    name: `Match ${i + 1}`,
    timestamp: DAYS_AGO(Math.floor(Math.random() * 365)),
    messages: Array.from(
      { length: Math.floor(Math.random() * 50) + 1 },
      (_, j) => ({
        id: `msg-${i}-${j}`,
        timestamp: DAYS_AGO(Math.floor(Math.random() * 90) + j),
        body: j === 0 ? ['Hey!', 'Hi there!', 'Hello!', "What's up?", 'Hey, how are you?'][i % 5] : `Message ${j + 1}`,
        from: j % 2 === 0 ? 'you' : 'them',
      })
    ),
  })),
  messages: [],
  likes: Array.from({ length: 89 }, (_, i) => ({
    timestamp: DAYS_AGO(Math.floor(Math.random() * 365)),
  })),
  matchTimestamps: [],
};

// Flatten messages for mock
MOCK_HINGE_DATA.messages = MOCK_HINGE_DATA.matches.flatMap((m) =>
  (m.messages || []).map((msg) => ({
    ...msg,
    timestamp: msg.timestamp || msg.created_at,
  }))
);

MOCK_HINGE_DATA.matchTimestamps = MOCK_HINGE_DATA.matches
  .filter((m) => m.timestamp)
  .map((m) => ({
    matchId: m.match_id || '',
    timestamp: new Date(m.timestamp!),
  }));
