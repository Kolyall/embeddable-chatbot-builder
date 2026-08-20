/**
 * TXT and MD are used as raw text directly — no markdown stripping, the
 * chunker just treats markdown syntax as regular text.
 */
export async function parseText(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8");
}
