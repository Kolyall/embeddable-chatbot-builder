import mammoth from "mammoth";

/** Parses a DOCX buffer into plain text (formatting/styles discarded). */
export async function parseDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}
