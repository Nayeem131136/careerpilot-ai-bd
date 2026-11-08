CREATE TABLE "page_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"kind" text NOT NULL,
	"sector" text DEFAULT 'government' NOT NULL,
	"country" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_fetch_at" timestamp,
	"last_count" integer,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "sector" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "work_mode" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "deadline" text;--> statement-breakpoint
CREATE UNIQUE INDEX "page_sources_url_uidx" ON "page_sources" USING btree ("url");