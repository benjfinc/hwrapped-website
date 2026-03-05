/**
 * Generate wrapped-style slides from computed stats
 * Uses correct Hinge export formulas
 */

import type { HingeStats, SlideData } from './types';

export function generateSlides(stats: HingeStats): SlideData[] {
  const hasExtendedData = stats.profileName || stats.totalPhotos || stats.totalPrompts || stats.accountAgeDays;

  const slides: SlideData[] = [
    {
      id: 'intro',
      title: 'Your year on Hinge',
      stat: new Date().getFullYear(),
      subtitle: stats.profileName ? `Hey ${stats.profileName}! Here's your dating wrapped` : "Here's your dating wrapped",
      chartType: 'none',
    },
    {
      id: 'funnel',
      title: 'Your relationship funnel',
      stat: `${stats.totalMatches} matches`,
      subtitle: `From ${stats.totalRecords} interactions • ${stats.totalConversations} became conversations`,
      chartType: 'none',
    },
    {
      id: 'matches',
      title: 'You got',
      stat: stats.totalMatches,
      subtitle: 'mutual matches',
      chartType: 'none',
    },
    {
      id: 'conversations',
      title: 'Conversations started',
      stat: stats.totalConversations,
      subtitle: `${stats.conversationRate.toFixed(1)}% of matches led to chat`,
      chartType: 'none',
    },
    {
      id: 'messages',
      title: 'Messages in your conversations',
      stat: stats.totalMessages.toLocaleString(),
      subtitle: `~${stats.avgMessagesPerConversation.toFixed(1)} per conversation`,
      chartType: 'none',
    },
    ...(hasExtendedData && stats.profileName
      ? [
          {
            id: 'profile',
            title: 'Your profile',
            stat: `${stats.profileName}${stats.profileAge ? `, ${stats.profileAge}` : ''}`,
            subtitle: stats.accountAgeDays ? `On Hinge for ${Math.round(stats.accountAgeDays / 30)} months` : undefined,
            chartType: 'none' as const,
          },
        ]
      : []),
    ...(hasExtendedData && (stats.totalPhotos || stats.totalPrompts)
      ? [
          {
            id: 'media',
            title: 'Your Hinge presence',
            stat: `${stats.totalPhotos || 0} photos`,
            subtitle: stats.totalPrompts ? `${stats.totalPrompts} prompt answers` : undefined,
            chartType: 'none' as const,
          },
        ]
      : []),
    {
      id: 'active-day',
      title: 'Your most active day was',
      stat: stats.mostActiveDayOfWeek,
      subtitle: "That's when you were in your element",
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
      title: 'Your longest conversation',
      stat: `${stats.longestConversationMessages} messages`,
      subtitle: `Spanning ${stats.longestConversation.days} days`,
      chartType: 'none',
    },
    {
      id: 'match-streak',
      title: 'Longest match streak',
      stat: `${stats.longestMatchStreak} days`,
      subtitle: 'Consecutive days with new matches',
      chartType: 'none',
    },
    ...(stats.topEmojis?.length
      ? [
          {
            id: 'emojis',
            title: 'Your top emoji',
            stat: stats.topEmojis[0]?.emoji || '😊',
            subtitle: `Used ${stats.topEmojis[0]?.count} times • ${stats.questionRate.toFixed(1)}% of messages had a ?`,
            chartType: 'none' as const,
          },
        ]
      : []),
    {
      id: 'content-stats',
      title: 'Message analytics',
      stat: `${stats.totalWords.toLocaleString()} words`,
      subtitle: `~${stats.avgWordsPerMessage.toFixed(1)} per message • ${stats.totalCharacters.toLocaleString()} characters`,
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
      id: 'funnel-chart',
      title: 'Interaction funnel',
      stat: '',
      subtitle: `Likes: ${stats.likesOnly} • Matches: ${stats.totalMatches} • Conversations: ${stats.totalConversations}`,
      chartType: 'pie',
      chartData: [
        { name: 'Matches', value: stats.totalMatches },
        { name: 'Likes only', value: stats.likesOnly },
      ],
    },
    {
      id: 'fun-stats',
      title: 'Quick stats',
      stat: '',
      subtitle: `Top opener: "${stats.mostUsedOpener}" • Most active month: ${stats.mostActiveMonth}`,
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
