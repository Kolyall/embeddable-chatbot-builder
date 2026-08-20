const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guards against handing a non-UUID `chatbotId` straight to a `uuid` column
 * query — Postgres throws a raw `invalid input syntax for type uuid` error
 * for that (surfaces as an uncaught 500), which matters on the public widget
 * routes since `chatbotId` there comes straight from an untrusted URL
 * segment with no prior auth gate to filter out garbage input first.
 */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
