ALTER TABLE "chatbots" ALTER COLUMN "chat_provider_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chatbots" ALTER COLUMN "chat_provider_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ALTER COLUMN "embedding_provider" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chatbots" ALTER COLUMN "embedding_provider" DROP NOT NULL;--> statement-breakpoint

-- The 'platform' provider option is being removed entirely (every chatbot
-- is now BYOK-only). Any existing row using it never had real BYOK
-- credentials stored (chat_api_key_encrypted/embedding_api_key_encrypted
-- were null for the platform path), so there's no faithful BYOK equivalent
-- to migrate it to — set it to null ("not configured yet") rather than
-- mislabeling it as a BYOK provider with missing credentials. The owner
-- re-configures a real provider/key in Settings.
UPDATE "chatbots" SET "chat_provider_type" = NULL WHERE "chat_provider_type" = 'platform';--> statement-breakpoint
UPDATE "chatbots" SET "embedding_provider" = NULL WHERE "embedding_provider" = 'platform';--> statement-breakpoint

ALTER TABLE "public"."chatbots" ALTER COLUMN "chat_provider_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."chat_provider_type";--> statement-breakpoint
CREATE TYPE "public"."chat_provider_type" AS ENUM('openai_compatible', 'anthropic');--> statement-breakpoint
ALTER TABLE "public"."chatbots" ALTER COLUMN "chat_provider_type" SET DATA TYPE "public"."chat_provider_type" USING "chat_provider_type"::"public"."chat_provider_type";--> statement-breakpoint
ALTER TABLE "public"."chatbots" ALTER COLUMN "embedding_provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."embedding_provider";--> statement-breakpoint
CREATE TYPE "public"."embedding_provider" AS ENUM('openai', 'gemini', 'voyage', 'cohere');--> statement-breakpoint
ALTER TABLE "public"."chatbots" ALTER COLUMN "embedding_provider" SET DATA TYPE "public"."embedding_provider" USING "embedding_provider"::"public"."embedding_provider";