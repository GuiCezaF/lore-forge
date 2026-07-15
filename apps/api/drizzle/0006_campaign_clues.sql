CREATE TABLE "campaign_clues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE cascade,
  "kind" text DEFAULT 'text' NOT NULL,
  "gm_label" text NOT NULL,
  "title" text,
  "private_notes" text,
  "content" jsonb NOT NULL,
  "style" text DEFAULT 'plain-document' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "campaign_clues_kind_check" CHECK ("kind" = 'text'),
  CONSTRAINT "campaign_clues_style_check" CHECK ("style" IN ('plain-document', 'handwritten-letter', 'typewritten-report', 'newspaper-clipping', 'confidential-dossier'))
);--> statement-breakpoint
CREATE INDEX "campaign_clues_campaign_updated_at_idx" ON "campaign_clues" ("campaign_id", "updated_at");
