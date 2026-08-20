/** Splits `items` into chunks of at most `size` — used to batch embedding
 * calls against providers with a per-request input limit. */
export function batchArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
