CREATE TABLE "refresh_tokens" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID        NOT NULL,
  "token"      VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMP   NOT NULL,
  "revoked_at" TIMESTAMP,
  "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
  CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token");
