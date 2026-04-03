-- Users table
CREATE TABLE "users" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "name"          VARCHAR(255) NOT NULL,
  "email"         VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "created_at"    TIMESTAMP   NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_users_email" UNIQUE ("email"),
  CONSTRAINT "PK_users" PRIMARY KEY ("id")
);

-- Service enums
CREATE TYPE "services_tipo_enum" AS ENUM (
  'OBRA_INCENDIO', 'CONSULTORIA', 'PROJETO', 'MANUTENCAO'
);

CREATE TYPE "services_status_enum" AS ENUM (
  'EM_ANDAMENTO', 'CONCLUIDO', 'PAUSADO', 'CANCELADO'
);

CREATE TYPE "services_forma_pagamento_enum" AS ENUM (
  'A_VISTA', 'PARCELADO', 'MENSAL'
);

-- Services table
CREATE TABLE "services" (
  "id"              UUID                           NOT NULL DEFAULT gen_random_uuid(),
  "cliente"         JSONB                          NOT NULL,
  "tipo"            "services_tipo_enum"           NOT NULL,
  "status"          "services_status_enum"         NOT NULL,
  "data_inicio"     DATE                           NOT NULL,
  "data_fim"        DATE,
  "valor_total"     DECIMAL(10,2)                  NOT NULL,
  "forma_pagamento" "services_forma_pagamento_enum" NOT NULL,
  "cronograma"      JSONB,
  "pagamentos"      JSONB,
  "documentos"      JSONB,
  "custos_fixos"    JSONB,
  "parcelamento"    JSONB,
  "created_at"      TIMESTAMP                      NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMP                      NOT NULL DEFAULT now(),
  CONSTRAINT "PK_services" PRIMARY KEY ("id")
);
