import { customType } from "drizzle-orm/pg-core";

/**
 * pgvector column with NO fixed dimension (Decision 6/schema note from the
 * implementation plan): different chatbots may pick different embedding
 * providers/models with different vector lengths. Every similarity query is
 * scoped by chatbot_id, so mismatched-length comparisons never actually
 * occur — brute-force `ORDER BY embedding <=> $1` is fine at this scale.
 */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(",")
      .filter(Boolean)
      .map(Number);
  },
});
