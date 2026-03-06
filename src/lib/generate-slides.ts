/**
 * Generate wrapped-style slides from computed stats
 * Uses correct Hinge export formulas
 */

import type { HingeStats, SlideData } from './types';

export function generateSlides(stats: HingeStats): SlideData[] {
  const slides: SlideData[] = [
    {
      id: 'intro',
      title: 'Your year on Hinge',
      stat: new Date().getFullYear(),
      subtitle: "Here's your dating wrapped",
      chartType: 'none',
    },
    {
      id: 'likes',
      title: 'You had',
      stat: stats.totalLikes,
      subtitle: 'total likes/interactions',
      chartType: 'none',
    },
    {
      id: 'matches',
      title: 'You got',
      stat: stats.totalMatches,
      subtitle: `${stats.matchRateFromLikes.toFixed(1)}% of likes became matches`,
      chartType: 'none',
    },
    {
      id: 'chats',
      title: 'Chats started',
      stat: stats.totalConversations,
      subtitle: `${stats.conversationRate.toFixed(1)}% of matches led to chat`,
      chartType: 'none',
    },
    {
      id: 'interaction-summary',
      title: 'Likes -> Matches -> Chats',
      stat: `${stats.conversationRateFromLikes.toFixed(1)}%`,
      subtitle: 'of all likes turned into real conversations',
      chartType: 'bar',
      chartData: [
        { name: 'Likes', value: stats.totalLikes },
        { name: 'Matches', value: stats.totalMatches },
        { name: 'Chats', value: stats.totalConversations },
      ],
    },
    {
      id: 'months',
      title: 'Your busiest month was',
      stat: stats.mostActiveMonth,
      subtitle: 'Monthly conversation activity',
      chartType: 'bar',
      chartData: stats.messagesByMonth.map((item) => ({ name: item.month, value: item.count })),
    },
    {
      id: 'active-day',
      title: 'Your most active day',
      stat: stats.mostActiveDayOfWeek,
      subtitle: `Peak hour: ${stats.mostActiveTimeOfDay}`,
      chartType: 'bar',
      chartData: Object.entries(stats.messagesByHour).map(([hour, count]) => ({
        name: `${hour}:00`,
        value: count,
      })),
    },
    {
      id: 'longest-convo',
      title: 'Your longest conversation',
      stat: `${stats.longestConversationMessages} messages`,
      subtitle: `Spanning ${stats.longestConversation.days} days`,
      chartType: 'none',
    },
    {
      id: 'opener',
      title: 'Top opener',
      stat: `"${stats.mostUsedOpener}"`,
      subtitle: 'Your most-used first line',
      chartType: 'none',
    },
    ...(stats.accountAgeDays
      ? [
          {
            id: 'account-age',
            title: 'Account age',
            stat: `${Math.round(stats.accountAgeDays / 30)} months`,
            subtitle: 'How long your Hinge account has been active',
            chartType: 'none' as const,
          },
        ]
      : []),
    ...(stats.topEmojis.length
      ? [
          {
            id: 'emoji-top5',
            title: 'Top 5 emojis',
            stat: stats.topEmojis.map((item) => item.emoji).join('  '),
            subtitle: stats.topEmojis.map((item) => `${item.emoji}×${item.count}`).join('   '),
            chartType: 'none' as const,
          },
        ]
      : []),
  ];

  return slides;
}
