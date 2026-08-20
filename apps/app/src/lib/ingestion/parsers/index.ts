import { parsePdf } from "./pdf";
import { parseDocx } from "./docx";
import { parseText } from "./text";

export class UnsupportedFileTypeError extends Error {
  constructor(filename: string) {
    super(`Unsupported file type for "${filename}" — only PDF, DOCX, TXT, and MD are supported.`);
  }
}

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx + 1).toLowerCase();
}

/** Dispatches to the right parser by file extension and returns plain text. */
export async function parseDocument(buffer: Buffer, filename: string): Promise<string> {
  const ext = extensionOf(filename);
  switch (ext) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "txt":
    case "md":
      return parseText(buffer);
    default:
      throw new UnsupportedFileTypeError(filename);
  }
}

export const SUPPORTED_EXTENSIONS = ["pdf", "docx", "txt", "md"] as const;

export function isSupportedExtension(filename: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extensionOf(filename));
}
