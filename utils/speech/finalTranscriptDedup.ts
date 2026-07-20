export function shouldAcceptFinalTranscript(
  lastAccepted: string | null,
  transcript: string,
): boolean {
  const normalized = transcript.trim();

  if (!normalized) {
    return false;
  }

  return normalized !== lastAccepted;
}
