const TONES = [
  "bg-match-1",
  "bg-match-2",
  "bg-match-3",
  "bg-match-4",
  "bg-match-5",
] as const;

function toneIndex(matchId: string): number {
  let hash = 0;
  for (let index = 0; index < matchId.length; index += 1) {
    hash = (hash * 31 + matchId.charCodeAt(index)) >>> 0;
  }
  return hash % TONES.length;
}

/** A stable card colour per match, derived from its id so the colour a row
 *  shows in the list is the same colour pick-a-side opens with. */
export function matchTone(matchId: string, offset = 0): string {
  return TONES[(toneIndex(matchId) + offset) % TONES.length];
}
