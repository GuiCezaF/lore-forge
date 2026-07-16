CREATE TABLE "campaign_spectator_access" (
  "campaign_id" uuid PRIMARY KEY NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_spectator_access_token_hash_unique" ON "campaign_spectator_access" USING btree ("token_hash");
