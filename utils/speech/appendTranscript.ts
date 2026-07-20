export function appendTranscript(current: string, transcript: string): string {
  const normalized = transcript.trim();

  if (!normalized) {
    return current;
  }

  if (!current.trim()) {
    return normalized;
  }

  return `${current.trim()} ${normalized}`;
}
