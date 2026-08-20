export type ChunkOptions = {
  chunkSize?: number;
  overlap?: number;
};

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 100;

/**
 * Splits `text` into overlapping ~chunkSize-character chunks, preferring to
 * break on paragraph boundaries, then sentence boundaries, then whitespace —
 * only falling back to a hard mid-word cut if nothing better is available
 * within a reasonable lookback window. Kept intentionally simple: a single
 * forward pass with a bounded backward search for a good break point, plus a
 * fixed-size overlap carried into the next chunk for retrieval context.
 */
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = opts.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      end = findBreakPoint(normalized, start, end);
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;

    // Next chunk starts `overlap` characters before this one ended, but
    // never before `start` (avoids an infinite loop on tiny/zero progress).
    const nextStart = Math.max(end - overlap, start + 1);
    start = nextStart;
  }

  return chunks;
}

/**
 * Looks backward from the naive `end` cut for the best available boundary:
 * a paragraph break, then sentence-ending punctuation, then whitespace.
 * Searches at most the second half of the [start, end) window so a chunk
 * never shrinks below ~half its target size.
 */
function findBreakPoint(text: string, start: number, end: number): number {
  const minEnd = start + Math.floor((end - start) / 2);
  const window = text.slice(minEnd, end);

  const paraBreak = window.lastIndexOf("\n\n");
  if (paraBreak !== -1) return minEnd + paraBreak + 2;

  const sentenceMatch = findLastSentenceEnd(window);
  if (sentenceMatch !== -1) return minEnd + sentenceMatch;

  const newline = window.lastIndexOf("\n");
  if (newline !== -1) return minEnd + newline + 1;

  const space = window.lastIndexOf(" ");
  if (space !== -1) return minEnd + space + 1;

  return end;
}

function findLastSentenceEnd(window: string): number {
  let best = -1;
  const re = /[.!?](?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(window)) !== null) {
    best = match.index + 1;
  }
  return best;
}
