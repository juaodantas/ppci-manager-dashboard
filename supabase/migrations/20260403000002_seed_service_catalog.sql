-- ============================================================
-- M7 — Seed: categorias e serviços PPCI
-- ============================================================

DO $$
DECLARE
  cat_levantamento UUID := gen_random_uuid();
  cat_visitas      UUID := gen_random_uuid();
  cat_ppci         UUID := gen_random_uuid();
  cat_especificos  UUID := gen_random_uuid();
  cat_renovacao    UUID := gen_random_uuid();
  cat_laudos       UUID := gen_random_uuid();
  cat_consultoria  UUID := gen_random_uuid();
  cat_pet          UUID := gen_random_uuid();
  cat_outros       UUID := gen_random_uuid();

  -- services ids
  svc UUID;
BEGIN

-- ============================================================
-- Categorias
-- ============================================================

INSERT INTO service_category (id, name) VALUES
  (cat_levantamento, 'Levantamento / Digitalização'),
  (cat_visitas,      'Visitas / Reuniões'),
  (cat_ppci,         'Projetos PPCI'),
  (cat_especificos,  'Projetos Específicos'),
  (cat_renovacao,    'Renovação AVCB'),
  (cat_laudos,       'Laudos'),
  (cat_consultoria,  'Consultoria'),
  (cat_pet,          'PET'),
  (cat_outros,       'Outros');

-- ============================================================
-- Levantamento / Digitalização
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_levantamento, 'Levantamento arquitetônico e digitalização', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price (service_id, price_per_unit, minimum_price)
VALUES (svc, 1.50, 1300);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_levantamento, 'Digitalização plantas físicas', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.20, 1200, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_levantamento, 'Digitalização imagens eletrônicas', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.10, 1000, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_levantamento, 'Cadastramento sistemas incêndio', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 0.90, 900, CURRENT_DATE, NULL);

-- ============================================================
-- Visitas
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_visitas, 'Visita técnica', 'hora')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 400, 400, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_visitas, 'Reunião', 'hora')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 350, 350, CURRENT_DATE, NULL);

-- ============================================================
-- Projetos PPCI
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_ppci, 'PCI PTS', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 2.10, 1600, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_ppci, 'PCI convencional extintor', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.50, 1800, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_ppci, 'PCI convencional hidrantes', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.70, 2200, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_ppci, 'PCI edificação tombada', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 6.00, 3800, CURRENT_DATE, NULL);

-- ============================================================
-- Projetos Específicos
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_especificos, 'Sprinklers', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 3.00, 2600, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_especificos, 'Detecção', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.50, 1200, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_especificos, 'Escada pressurizada', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 2.60, 1900, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_especificos, 'Elevador emergência', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 2.10, 1600, CURRENT_DATE, NULL);

-- ============================================================
-- Renovação AVCB (com múltiplas faixas)
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_renovacao, 'Renovação AVCB extintor', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES
(gen_random_uuid(), svc, 1.30, 1500, CURRENT_DATE, NULL),
(gen_random_uuid(), svc, 0.60, 2200, CURRENT_DATE, NULL),
(gen_random_uuid(), svc, 0.40, 2600, CURRENT_DATE, NULL);

-- ============================================================
-- Consultoria
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_consultoria, 'Consultoria análise arquitetônica', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 0.40, 1300, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_consultoria, 'Consultoria análise PCI', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 0.50, 1600, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_consultoria, 'Assessoria PCI', 'hora')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 300, 600, CURRENT_DATE, NULL);

-- ============================================================
-- PET
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_pet, 'PET risco mínimo', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.10, 2000, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_pet, 'PET risco baixo', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.15, 2500, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_pet, 'PET risco médio', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.20, 3200, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_pet, 'PET risco alto', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.25, 4300, CURRENT_DATE, NULL);

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_pet, 'PET risco especial', 'm2')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 1.30, 6200, CURRENT_DATE, NULL);

-- ============================================================
-- Outros
-- ============================================================

INSERT INTO services (category_id, name, unit_type)
VALUES (cat_outros, 'Bloquinho de carnaval', 'un')
RETURNING id INTO svc;

INSERT INTO service_price VALUES (gen_random_uuid(), svc, 500, 500, CURRENT_DATE, NULL);

END $$;