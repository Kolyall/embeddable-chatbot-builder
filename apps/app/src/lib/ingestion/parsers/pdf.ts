import { extractText, getDocumentProxy } from "unpdf";

/**
 * Parses a PDF buffer into plain text. Uses `unpdf`'s bundled serverless
 * pdf.js build (no native deps, no worker threads) so it bundles cleanly
 * with esbuild for the standalone ingestion worker.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}
