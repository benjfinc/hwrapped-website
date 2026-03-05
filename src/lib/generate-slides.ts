/**
 * Generate wrapped-style slides from computed stats
 */

import type { HingeStats, SlideData } from './types';

export function generateSlides(stats: HingeStats): SlideData[] {
  const slides: SlideData[] = [
    {
      id: 'intro',
      title: 'Your year on Hinge',
      stat: new Date().getFullYear(),
      subtitle: 'Here\'s your dating wrapped',
      chartType: 'none',
    },
    {
      id: 'matches',
      title: 'You got',
      stat: stats.totalMatches,
      subtitle: 'matches this year',
      chartType: 'none',
    },
    {
      id: 'messages-sent',
      title: 'You sent',
      stat: stats.totalMessagesSent.toLocaleString(),
      subtitle: 'messages',
      chartType: 'none',
    },
    {
      id: 'messages-received',
      title: 'You received',
      stat: stats.totalMessagesReceived.toLocaleString(),
      subtitle: 'messages',
      chartType: 'none',
    },
    {
      id: 'active-day',
      title: 'Your most active day was',
      stat: stats.mostActiveDayOfWeek,
      subtitle: 'That\'s when you were in your element',
      chartType: 'bar',
      chartData: Object.entries(stats.messagesByHour).map(([hour, count]) => ({
        name: `${hour}:00`,
        value: count,
      })),
    },
    {
      id: 'active-time',
      title: 'Peak messaging hour',
      stat: stats.mostActiveTimeOfDay,
      subtitle: 'Your prime time for connections',
      chartType: 'bar',
      chartData: Object.entries(stats.messagesByHour)
        .filter(([, v]) => v > 0)
        .map(([hour, count]) => ({ name: `${parseInt(hour)}:00`, value: count })),
    },
    {
      id: 'longest-convo',
      title: 'Your longest conversation lasted',
      stat: `${stats.longestConversation.days} days`,
      subtitle: stats.longestConversation.matchName ? `With ${stats.longestConversation.matchName}` : undefined,
      chartType: 'none',
    },
    {
      id: 'longest-streak',
      title: 'Longest messaging streak',
      stat: `${stats.longestStreak} days`,
      subtitle: 'You kept the conversation going',
      chartType: 'none',
    },
    {
      id: 'rizz',
      title: 'Your Rizz Score',
      stat: stats.rizzScore,
      subtitle: 'Based on your response rate and engagement',
      chartType: 'none',
    },
    {
      id: 'heatmap',
      title: 'Message activity',
      stat: 'Heatmap',
      subtitle: 'When you were most active',
      chartType: 'heatmap',
      chartData: stats.messagesByDay,
    },
    {
      id: 'match-rate',
      title: 'Match rate',
      stat: `${stats.matchRate}%`,
      subtitle: 'Of your likes became matches',
      chartType: 'pie',
      chartData: [
        { name: 'Matches', value: stats.totalMatches },
        {
          name: 'Likes',
          value:
            stats.matchRate > 0
              ? Math.max(0, Math.round(stats.totalMatches / (stats.matchRate / 100)) - stats.totalMatches)
              : 0,
        },
      ],
    },
    {
      id: 'fun-stats',
      title: 'Quick stats',
      stat: '',
      subtitle: `Fastest reply: ${stats.fastestReply} min • Ghosted: ${stats.ghostedConversations} • Top opener: "${stats.mostUsedOpener}"`,
      chartType: 'none',
    },
    {
      id: 'share',
      title: 'Share your Hinge Wrapped',
      stat: '📸',
      subtitle: 'Export your stats and share with friends',
      chartType: 'none',
    },
  ];

  return slides;
}
