CREATE TABLE "scholarship_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"scholarship_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"host_country" text NOT NULL,
	"universities" text[] DEFAULT '{}' NOT NULL,
	"levels" text[] DEFAULT '{}' NOT NULL,
	"fields" text[] DEFAULT '{}' NOT NULL,
	"funding" text DEFAULT 'full' NOT NULL,
	"coverage" text DEFAULT '' NOT NULL,
	"eligibility" text DEFAULT '' NOT NULL,
	"bangladesh_eligible" text DEFAULT 'check' NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"how_to_apply" text DEFAULT '' NOT NULL,
	"deadline_text" text DEFAULT '' NOT NULL,
	"deadline_date" timestamp,
	"official_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"origin" text DEFAULT 'manual' NOT NULL,
	"last_verified_at" timestamp,
	"check_hash" text,
	"check_status" text,
	"checked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scholarship_saves" ADD CONSTRAINT "scholarship_saves_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_saves" ADD CONSTRAINT "scholarship_saves_scholarship_id_scholarships_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scholarship_saves_uidx" ON "scholarship_saves" USING btree ("user_id","scholarship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scholarships_url_uidx" ON "scholarships" USING btree ("official_url");--> statement-breakpoint
CREATE INDEX "scholarships_status_idx" ON "scholarships" USING btree ("status");