CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"path" text DEFAULT '' NOT NULL,
	"route_type" text,
	"digest" text,
	"stack" text,
	"count" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "error_logs_fp_uidx" ON "error_logs" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "error_logs_seen_idx" ON "error_logs" USING btree ("last_seen_at");