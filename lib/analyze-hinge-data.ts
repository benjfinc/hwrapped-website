type NormalizedMessage = {
  conversationId: string;
  senderId: string;
  timestamp: Date;
  text?: string;
};

type NormalizedMatch = {
  matchId: string;
  timestamp: Date;
  otherUserId?: string;
};

export type WrappedStats = {
  totals: {
    matches: number | null;
    conversations: number | null;
    messagesSent: number | null;
    messagesReceived: number | null;
    messagesTotal: number | null;
  };

  activity: {
    mostActiveDow: number | null;
    mostActiveHour: number | null;
    messagesByDow: number[] | null;
    messagesByHour: number[] | null;
    matchesByMonth: { ym: string; count: number }[] | null;
  };

  conversations: {
    longestByMessages: { conversationId: string; count: number } | null;
    longestByDurationDays: { conversationId: string; days: number } | null;
    avgMessagesPerConversation: number | null;
  };

  responsiveness: {
    medianResponseTimeMinutes: number | null;
    responseTimeMinutesP90: number | null;
  };

  ghosting: {
    ghostedCount: number | null;
  };

  warnings: string[];
};

type AnalyzeOptions = {
  currentUserId: string;
  timezone?: string;
  ghostWindowDays?: number;
};

type NormalizationDiagnostics = {
  messageCandidates: number;
  droppedMessagesMissingConversationId: number;
  droppedMessagesMissingSenderId: number;
  droppedMessagesMissingTimestamp: number;
  duplicateMessagesDropped: number;
  matchCandidates: number;
  droppedMatchesMissingTimestamp: number;
  droppedMatchesMissingDedupeKey: number;
  duplicateMatchesDropped: number;
};

type TraverseContext = {
  conversationId: string | null;
};

const MESSAGE_ARRAY_KEYS = new Set(["messages", "message", "chats", "chat_messages"]);
const MATCH_ARRAY_KEYS = new Set(["matches", "match", "connections"]);

const DOW_SHORT_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const MAX_RESPONSE_MINUTES = 14 * 24 * 60;
const MINUTES_IN_DAY = 24 * 60;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function asRecordId(value: unknown): string | null {
  const direct = asString(value);
  if (direct) return direct;
  if (!isRecord(value)) return null;
  return (
    asString(value.id) ??
    asString(value.user_id) ??
    asString(value.sender_id) ??
    asString(value.match_id) ??
    null
  );
}

function parseUtcDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 1e12 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = asString(value);
  if (!raw) return null;

  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return null;
    const millis = numeric < 1e12 ? numeric * 1000 : numeric;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const withTime = dateOnly.test(normalized) ? `${normalized}T00:00:00` : normalized;
  const hasZone = /(?:Z|[+\-]\d{2}:\d{2})$/i.test(normalized);
  const utcCandidate = hasZone ? withTime : `${withTime}Z`;
  const date = new Date(utcCandidate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractConversationId(record: UnknownRecord): string | null {
  return (
    asString(record.conversationId) ??
    asString(record.conversation_id) ??
    asString(record.match_id) ??
    asString(record.thread_id) ??
    asString(record.chat_id) ??
    null
  );
}

function extractMessageSenderId(record: UnknownRecord): string | null {
  return (
    asRecordId(record.senderId) ??
    asRecordId(record.sender_id) ??
    asRecordId(record.sender) ??
    asRecordId(record.from) ??
    asRecordId(record.author) ??
    asRecordId(record.user) ??
    asRecordId(record.user_id) ??
    asRecordId(record.from_id) ??
    null
  );
}

function extractMessageTimestamp(record: UnknownRecord): Date | null {
  return (
    parseUtcDate(record.timestamp) ??
    parseUtcDate(record.created_at) ??
    parseUtcDate(record.sent_at) ??
    parseUtcDate(record.time) ??
    parseUtcDate(record.date) ??
    null
  );
}

function extractMessageText(record: UnknownRecord): string | undefined {
  return (
    asString(record.text) ??
    asString(record.body) ??
    asString(record.message) ??
    asString(record.content) ??
    undefined
  );
}

function extractMatchTimestamp(record: UnknownRecord): Date | null {
  return (
    parseUtcDate(record.timestamp) ??
    parseUtcDate(record.created_at) ??
    parseUtcDate(record.matched_at) ??
    parseUtcDate(record.date) ??
    null
  );
}

function extractMatchId(record: UnknownRecord): string | null {
  return asString(record.matchId) ?? asString(record.match_id) ?? asString(record.id) ?? null;
}

function extractOtherUserId(record: UnknownRecord): string | null {
  return (
    asRecordId(record.otherUserId) ??
    asRecordId(record.other_user_id) ??
    asRecordId(record.user_id) ??
    asRecordId(record.participant_id) ??
    asRecordId(record.partner_id) ??
    null
  );
}

function walkForCandidates(
  node: unknown,
  context: TraverseContext,
  messageCandidates: { record: unknown; fallbackConversationId: string | null }[],
  matchCandidates: unknown[]
): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walkForCandidates(item, context, messageCandidates, matchCandidates));
    return;
  }
  if (!isRecord(node)) return;

  const conversationId = extractConversationId(node) ?? context.conversationId;

  Object.entries(node).forEach(([key, value]) => {
    const lower = key.toLowerCase();
    if (Array.isArray(value) && MESSAGE_ARRAY_KEYS.has(lower)) {
      value.forEach((item) => {
        messageCandidates.push({ record: item, fallbackConversationId: conversationId });
      });
    }
    if (Array.isArray(value) && MATCH_ARRAY_KEYS.has(lower)) {
      value.forEach((item) => {
        matchCandidates.push(item);
      });
    }
    walkForCandidates(value, { conversationId }, messageCandidates, matchCandidates);
  });
}

function collectCandidates(raw: unknown): {
  messageCandidates: { record: unknown; fallbackConversationId: string | null }[];
  matchCandidates: unknown[];
} {
  const messageCandidates: { record: unknown; fallbackConversationId: string | null }[] = [];
  const matchCandidates: unknown[] = [];

  walkForCandidates(raw, { conversationId: null }, messageCandidates, matchCandidates);

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (isRecord(item)) {
        const conversationId = extractConversationId(item);
        if (extractMessageTimestamp(item)) {
          messageCandidates.push({ record: item, fallbackConversationId: conversationId });
        } else if (extractMatchTimestamp(item)) {
          matchCandidates.push(item);
        }
      }
    });
  }

  return { messageCandidates, matchCandidates };
}

function normalizeAndDedupe(raw: unknown): {
  messages: NormalizedMessage[];
  matches: NormalizedMatch[];
  diagnostics: NormalizationDiagnostics;
} {
  const diagnostics: NormalizationDiagnostics = {
    messageCandidates: 0,
    droppedMessagesMissingConversationId: 0,
    droppedMessagesMissingSenderId: 0,
    droppedMessagesMissingTimestamp: 0,
    duplicateMessagesDropped: 0,
    matchCandidates: 0,
    droppedMatchesMissingTimestamp: 0,
    droppedMatchesMissingDedupeKey: 0,
    duplicateMatchesDropped: 0
  };

  const { messageCandidates, matchCandidates } = collectCandidates(raw);
  diagnostics.messageCandidates = messageCandidates.length;
  diagnostics.matchCandidates = matchCandidates.length;

  const normalizedMessages: NormalizedMessage[] = [];
  messageCandidates.forEach(({ record, fallbackConversationId }) => {
    if (!isRecord(record)) return;

    const conversationId = extractConversationId(record) ?? fallbackConversationId;
    const senderId = extractMessageSenderId(record);
    const timestamp = extractMessageTimestamp(record);

    if (!conversationId) {
      diagnostics.droppedMessagesMissingConversationId += 1;
      return;
    }
    if (!senderId) {
      diagnostics.droppedMessagesMissingSenderId += 1;
      return;
    }
    if (!timestamp) {
      diagnostics.droppedMessagesMissingTimestamp += 1;
      return;
    }

    normalizedMessages.push({
      conversationId,
      senderId,
      timestamp,
      text: extractMessageText(record)
    });
  });

  normalizedMessages.sort((a, b) => {
    const byConversation = a.conversationId.localeCompare(b.conversationId);
    if (byConversation !== 0) return byConversation;
    const bySender = a.senderId.localeCompare(b.senderId);
    if (bySender !== 0) return bySender;
    const byTime = a.timestamp.getTime() - b.timestamp.getTime();
    if (byTime !== 0) return byTime;
    return (a.text ?? "").localeCompare(b.text ?? "");
  });

  const dedupedMessages: NormalizedMessage[] = [];
  const seenMessageKeys = new Set<string>();
  normalizedMessages.forEach((message) => {
    const key = `${message.conversationId}__${message.senderId}__${message.timestamp.toISOString()}`;
    if (seenMessageKeys.has(key)) {
      diagnostics.duplicateMessagesDropped += 1;
      return;
    }
    seenMessageKeys.add(key);
    dedupedMessages.push(message);
  });

  const normalizedMatches: (NormalizedMatch & { dedupeKey: string })[] = [];
  matchCandidates.forEach((candidate) => {
    if (!isRecord(candidate)) return;
    const timestamp = extractMatchTimestamp(candidate);
    if (!timestamp) {
      diagnostics.droppedMatchesMissingTimestamp += 1;
      return;
    }

    const explicitMatchId = extractMatchId(candidate);
    const otherUserId = extractOtherUserId(candidate) ?? undefined;
    if (!explicitMatchId && !otherUserId) {
      diagnostics.droppedMatchesMissingDedupeKey += 1;
      return;
    }

    const matchId = explicitMatchId ?? `${timestamp.toISOString()}__${otherUserId}`;
    const dedupeKey = explicitMatchId
      ? `id:${explicitMatchId}`
      : `fallback:${timestamp.toISOString()}__${otherUserId}`;
    normalizedMatches.push({
      matchId,
      timestamp,
      otherUserId,
      dedupeKey
    });
  });

  normalizedMatches.sort((a, b) => {
    const byId = a.matchId.localeCompare(b.matchId);
    if (byId !== 0) return byId;
    const byTs = a.timestamp.getTime() - b.timestamp.getTime();
    if (byTs !== 0) return byTs;
    return (a.otherUserId ?? "").localeCompare(b.otherUserId ?? "");
  });

  const dedupedMatches: NormalizedMatch[] = [];
  const seenMatchKeys = new Set<string>();
  normalizedMatches.forEach((match) => {
    const key = match.dedupeKey;

    if (seenMatchKeys.has(key)) {
      diagnostics.duplicateMatchesDropped += 1;
      return;
    }
    seenMatchKeys.add(key);
    dedupedMatches.push({
      matchId: match.matchId,
      timestamp: match.timestamp,
      otherUserId: match.otherUserId
    });
  });

  return {
    messages: dedupedMessages,
    matches: dedupedMatches,
    diagnostics
  };
}

function groupByConversation(messages: NormalizedMessage[]): Map<string, NormalizedMessage[]> {
  const grouped = new Map<string, NormalizedMessage[]>();
  messages.forEach((message) => {
    const list = grouped.get(message.conversationId) ?? [];
    list.push(message);
    grouped.set(message.conversationId, list);
  });
  grouped.forEach((messagesInConversation) => {
    messagesInConversation.sort((a, b) => {
      const ts = a.timestamp.getTime() - b.timestamp.getTime();
      if (ts !== 0) return ts;
      return a.senderId.localeCompare(b.senderId);
    });
  });
  return grouped;
}

function getDayHourUtcOrTimezone(
  date: Date,
  timezone: string | undefined
): { dayIndex: number; hour: number } | null {
  if (!timezone) {
    return { dayIndex: date.getUTCDay(), hour: date.getUTCHours() };
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "numeric",
      hourCycle: "h23"
    }).formatToParts(date);
    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const hourValue = parts.find((part) => part.type === "hour")?.value;
    if (!weekday || !hourValue) return null;
    const dayIndex = DOW_SHORT_TO_INDEX[weekday];
    const hour = Number(hourValue);
    if (!Number.isInteger(dayIndex) || !Number.isInteger(hour)) return null;
    if (hour < 0 || hour > 23) return null;
    return { dayIndex, hour };
  } catch {
    return null;
  }
}

function argMax(values: number[]): number | null {
  if (values.length === 0) return null;
  let maxIndex = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > values[maxIndex]) maxIndex = i;
  }
  return maxIndex;
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function p90(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.ceil(0.9 * sorted.length) - 1;
  const bounded = Math.max(0, Math.min(sorted.length - 1, idx));
  return sorted[bounded];
}

function toYearMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function rounded(value: number): number {
  return Number(value.toFixed(3));
}

export function analyzeHingeData(
  raw: unknown,
  { currentUserId, timezone, ghostWindowDays = 14 }: AnalyzeOptions
): WrappedStats {
  const warnings: string[] = [];

  let effectiveGhostWindowDays = ghostWindowDays;
  if (!Number.isFinite(effectiveGhostWindowDays) || effectiveGhostWindowDays < 0) {
    effectiveGhostWindowDays = 14;
    warnings.push("Invalid ghostWindowDays; defaulted to 14.");
  }

  if (timezone) {
    const probe = getDayHourUtcOrTimezone(new Date("2024-01-01T00:00:00Z"), timezone);
    if (!probe) {
      warnings.push("Invalid timezone provided; activity metrics computed in UTC.");
      timezone = undefined;
    }
  }

  const { messages, matches, diagnostics } = normalizeAndDedupe(raw);

  if (diagnostics.droppedMessagesMissingConversationId > 0) {
    warnings.push(
      `Dropped ${diagnostics.droppedMessagesMissingConversationId} messages missing conversationId during normalization.`
    );
  }
  if (diagnostics.droppedMessagesMissingSenderId > 0) {
    warnings.push(`Dropped ${diagnostics.droppedMessagesMissingSenderId} messages missing senderId during normalization.`);
  }
  if (diagnostics.droppedMessagesMissingTimestamp > 0) {
    warnings.push(
      `Dropped ${diagnostics.droppedMessagesMissingTimestamp} messages missing timestamp during normalization.`
    );
  }
  if (diagnostics.duplicateMessagesDropped > 0) {
    warnings.push(`Removed ${diagnostics.duplicateMessagesDropped} duplicate messages during deduplication.`);
  }
  if (diagnostics.droppedMatchesMissingTimestamp > 0) {
    warnings.push(`Dropped ${diagnostics.droppedMatchesMissingTimestamp} matches missing timestamp during normalization.`);
  }
  if (diagnostics.droppedMatchesMissingDedupeKey > 0) {
    warnings.push(
      `Dropped ${diagnostics.droppedMatchesMissingDedupeKey} matches missing both matchId and otherUserId.`
    );
  }
  if (diagnostics.duplicateMatchesDropped > 0) {
    warnings.push(`Removed ${diagnostics.duplicateMatchesDropped} duplicate matches during deduplication.`);
  }

  const messageDataUnreliable =
    diagnostics.droppedMessagesMissingConversationId > 0 ||
    diagnostics.droppedMessagesMissingSenderId > 0 ||
    diagnostics.droppedMessagesMissingTimestamp > 0;
  const matchDataUnreliable =
    diagnostics.droppedMatchesMissingTimestamp > 0 || diagnostics.droppedMatchesMissingDedupeKey > 0;

  const conversationGroups = groupByConversation(messages);
  const conversationCount = conversationGroups.size;

  let messagesSent: number | null = null;
  let messagesReceived: number | null = null;
  let messagesTotal: number | null = null;

  if (!currentUserId || currentUserId.trim().length === 0) {
    warnings.push("currentUserId is required to compute sent/received/ghosting metrics.");
  } else if (messageDataUnreliable) {
    warnings.push("Message totals set to null because required message fields were missing.");
  } else {
    const sent = messages.filter((message) => message.senderId === currentUserId).length;
    const received = messages.length - sent;
    const total = sent + received;
    if (sent + received !== total) {
      warnings.push("Sanity check failed: messagesSent + messagesReceived !== messagesTotal.");
      messagesSent = null;
      messagesReceived = null;
      messagesTotal = null;
    } else {
      messagesSent = sent;
      messagesReceived = received;
      messagesTotal = total;
    }
  }

  const totals: WrappedStats["totals"] = {
    matches: matchDataUnreliable ? null : matches.length,
    conversations: messageDataUnreliable ? null : conversationCount,
    messagesSent,
    messagesReceived,
    messagesTotal
  };

  let longestByMessages: WrappedStats["conversations"]["longestByMessages"] = null;
  let longestByDurationDays: WrappedStats["conversations"]["longestByDurationDays"] = null;
  let avgMessagesPerConversation: number | null = null;

  if (messageDataUnreliable) {
    warnings.push("Conversation metrics set to null because required message fields were missing.");
  } else if (conversationCount > 0) {
    const aggregate = [...conversationGroups.entries()].map(([conversationId, conversationMessages]) => {
      const messageCount = conversationMessages.length;
      const firstTimestamp = conversationMessages[0].timestamp;
      const lastTimestamp = conversationMessages[conversationMessages.length - 1].timestamp;
      const days = (lastTimestamp.getTime() - firstTimestamp.getTime()) / (1000 * 60 * 60 * 24);
      return {
        conversationId,
        messageCount,
        durationDays: days
      };
    });

    aggregate.sort((a, b) => {
      if (b.messageCount !== a.messageCount) return b.messageCount - a.messageCount;
      return a.conversationId.localeCompare(b.conversationId);
    });
    longestByMessages = {
      conversationId: aggregate[0].conversationId,
      count: aggregate[0].messageCount
    };

    aggregate.sort((a, b) => {
      if (b.durationDays !== a.durationDays) return b.durationDays - a.durationDays;
      return a.conversationId.localeCompare(b.conversationId);
    });
    longestByDurationDays = {
      conversationId: aggregate[0].conversationId,
      days: rounded(aggregate[0].durationDays)
    };

    avgMessagesPerConversation = rounded(messages.length / conversationCount);
  }

  const conversations: WrappedStats["conversations"] = {
    longestByMessages,
    longestByDurationDays,
    avgMessagesPerConversation
  };

  let medianResponseTimeMinutes: number | null = null;
  let responseTimeMinutesP90: number | null = null;

  if (messageDataUnreliable) {
    warnings.push("Responsiveness metrics set to null because required message fields were missing.");
  } else {
    const responseMinutes: number[] = [];
    conversationGroups.forEach((conversationMessages) => {
      if (conversationMessages.length < 2) return;
      let previous = conversationMessages[0];
      for (let i = 1; i < conversationMessages.length; i += 1) {
        const current = conversationMessages[i];
        if (current.senderId !== previous.senderId) {
          const deltaMinutes = (current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60);
          if (deltaMinutes >= 0 && deltaMinutes <= MAX_RESPONSE_MINUTES) {
            responseMinutes.push(deltaMinutes);
          }
        }
        previous = current;
      }
    });

    responseMinutes.sort((a, b) => a - b);
    const med = median(responseMinutes);
    const p = p90(responseMinutes);
    medianResponseTimeMinutes = med === null ? null : rounded(med);
    responseTimeMinutesP90 = p === null ? null : rounded(p);
  }

  const responsiveness: WrappedStats["responsiveness"] = {
    medianResponseTimeMinutes,
    responseTimeMinutesP90
  };

  let messagesByDow: number[] | null = null;
  let messagesByHour: number[] | null = null;
  let mostActiveDow: number | null = null;
  let mostActiveHour: number | null = null;

  if (messageDataUnreliable) {
    warnings.push("Activity metrics set to null because required message fields were missing.");
  } else {
    const dow = Array.from({ length: 7 }, () => 0);
    const hour = Array.from({ length: 24 }, () => 0);

    let activityParseFailed = false;
    messages.forEach((message) => {
      const parts = getDayHourUtcOrTimezone(message.timestamp, timezone);
      if (!parts) {
        activityParseFailed = true;
        return;
      }
      dow[parts.dayIndex] += 1;
      hour[parts.hour] += 1;
    });

    if (activityParseFailed) {
      warnings.push("Activity metrics set to null because day/hour could not be derived for all messages.");
    } else {
      const baselineTotal = messagesTotal ?? messages.length;
      const sumDow = dow.reduce((sum, value) => sum + value, 0);
      if (sumDow !== baselineTotal) {
        warnings.push("Sanity check failed: sum(messagesByDow) !== total messages.");
      } else {
        messagesByDow = dow;
        messagesByHour = hour;
        if (baselineTotal > 0) {
          mostActiveDow = argMax(dow);
          mostActiveHour = argMax(hour);
        }
      }
    }
  }

  let matchesByMonth: { ym: string; count: number }[] | null = null;
  if (matchDataUnreliable) {
    warnings.push("Match monthly metrics set to null because required match fields were missing.");
  } else {
    const byMonth = new Map<string, number>();
    matches.forEach((match) => {
      const ym = toYearMonth(match.timestamp);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + 1);
    });
    matchesByMonth = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, count]) => ({ ym, count }));
  }

  const activity: WrappedStats["activity"] = {
    mostActiveDow,
    mostActiveHour,
    messagesByDow,
    messagesByHour,
    matchesByMonth
  };

  let ghostedCount: number | null = null;
  if (!currentUserId || currentUserId.trim().length === 0) {
    ghostedCount = null;
  } else if (messageDataUnreliable) {
    warnings.push("Ghosting metric set to null because required message fields were missing.");
  } else if (conversationCount === 0) {
    ghostedCount = 0;
  } else {
    const latestMessageTs = messages.reduce((max, message) => Math.max(max, message.timestamp.getTime()), -Infinity);
    const windowMinutes = effectiveGhostWindowDays * MINUTES_IN_DAY;
    let count = 0;

    conversationGroups.forEach((conversationMessages) => {
      if (conversationMessages.length < 3) return;
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      if (lastMessage.senderId !== currentUserId) return;
      const minutesSinceLast = (latestMessageTs - lastMessage.timestamp.getTime()) / (1000 * 60);
      if (minutesSinceLast >= windowMinutes) {
        count += 1;
      }
    });

    if (count > conversationCount) {
      warnings.push("Sanity check failed: ghostedCount exceeds total conversations.");
      ghostedCount = null;
    } else {
      ghostedCount = count;
    }
  }

  return {
    totals,
    activity,
    conversations,
    responsiveness,
    ghosting: { ghostedCount },
    warnings
  };
}
