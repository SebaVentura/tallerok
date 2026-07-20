import { env } from '@/config/env';

type SpeechLogEvent =
  | 'permission requested'
  | 'recognition started'
  | 'recognition ended'
  | 'recognition unavailable'
  | 'recognition error';

type SpeechLogMeta = Record<string, string | number | boolean | undefined>;

export function logSpeech(event: SpeechLogEvent, meta?: SpeechLogMeta): void {
  if (!env.isDevelopment && event !== 'recognition unavailable' && event !== 'recognition error') {
    return;
  }

  const suffix =
    meta && Object.keys(meta).length > 0
      ? ` ${JSON.stringify(meta)}`
      : '';

  console.log(`[speech] ${event}${suffix}`);
}
