# Spec: Company por Projeto

## Contexto
Hoje o sistema permite projetos e orçamentos sem uma "company" interna padronizada. Isso dificulta a padronização de CNPJ nos documentos (PDFs) e o recorte financeiro por entidade interna. A feature introduz uma company obrigatória para novos projetos/orçamentos, integra o recorte financeiro e de impostos, e cria uma seção dedicada de gestão de companies com CRUD completo e organização por tipo.

## Objetivos
- Garantir que todo **novo** projeto e **novo** orçamento tenham uma company interna associada.
- Persistir `company_id` em projetos e orçamentos e propagar do orçamento para o projeto criado.
- Exibir CNPJ da company em PDFs de orçamento e contrato.
- Permitir filtro financeiro por company, afetando receitas e despesas conforme regras definidas.
- Suportar custos gerais (sem company) via `company_id` nulo em custos fixos e variáveis.
- Criar seção dedicada de Company no sistema web com CRUD completo e listagem por tipo.

## Não‑objetivos
- Forçar backfill automático de company para projetos/orçamentos existentes.
- Implementar validação completa de dígitos do CNPJ (apenas formato/length).
- Alterar regras de impostos baseadas em `project_services.tax_deduction`.

## Requisitos (IDs)
### Cadastro e relacionamento
- **REQ-001** Criar tabela `companies` com campos: `name`, `cnpj`, `responsible`, `type` e timestamps.
- **REQ-002** `cnpj` deve ser único em `companies` (restrição de unicidade).
- **REQ-003** `type` deve ser um enum com valores: `internal`, `supplier`, `outsourced` (interna, fornecedor, terceirizada).
- **REQ-004** `projects.company_id` deve ser obrigatório para **novos** projetos e deve referenciar apenas companies do tipo `internal`.
- **REQ-005** `quotes.company_id` deve ser obrigatório para **novos** orçamentos e deve referenciar apenas companies do tipo `internal`.
- **REQ-006** Projetos e orçamentos existentes podem permanecer com `company_id` nulo e devem ser editáveis no frontend.
- **REQ-007** Ao criar projeto a partir de orçamento, `projects.company_id` deve ser copiado de `quotes.company_id`.
- **REQ-008** Projetos em status **finished** não podem trocar `company_id`.

### Seção Company (Web)
- **REQ-009** Criar página/seção dedicada de "Company" no menu de navegação do sistema.
- **REQ-010** A página de Company deve apresentar 3 abas: "Interna", "Fornecedores" e "Terceirizados", filtrando por `type`.
- **REQ-011** Cada aba deve listar as companies do tipo correspondente em tabela com colunas: `name`, `cnpj`, `responsible` e ações (editar, remover).
- **REQ-012** CRUD completo na página de Company: criar, listar, editar e remover companies.
- **REQ-013** Criação/edição via formulário (modal ou página dedicada) com campos: `name`, `cnpj`, `responsible`, `type`.
- **REQ-014** Remoção deve ser bloqueada se a company estiver vinculada a projetos, orçamentos ou custos (soft delete ou erro de integridade).
- **REQ-015** A aba ativa por padrão ao entrar na página deve ser "Interna".

### UI (Projeto/Orçamento)
- **REQ-016** Seleção de company deve existir dentro do fluxo de projeto e orçamento (dropdown filtrando apenas companies do tipo `internal`).
- **REQ-017** Deve ser possível cadastrar nova company inline via modal rápido a partir do fluxo de projeto/orçamento, com campo `type` pré-definido como `internal`.
- **REQ-018** Associar uma company não‑interna a projeto ou orçamento deve falhar com erro de validação.

### PDFs
- **REQ-019** PDFs de orçamento e contrato devem exibir o CNPJ da company (nome já existe; agora variável).

### Financeiro e impostos
- **REQ-020** Filtro por company deve afetar **receitas** via `payments -> projects.company_id`.
- **REQ-021** Filtro por company deve afetar **despesas** via `fixed_costs.company_id` e `variable_costs.company_id`.
- **REQ-022** Custos com `company_id` nulo são **custos gerais** e aparecem **apenas** quando não há filtro de company.
- **REQ-023** `variable_costs` deve ganhar `company_id` **nullable**.
- **REQ-024** `fixed_costs` deve ganhar `company_id` **nullable**.
- **REQ-025** Filtro de impostos por company deve considerar **apenas** custos variáveis gerados com tipo imposto (`variable_costs`), ignorando `project_services.tax_deduction`.

## Requisitos Não‑Funcionais (RNFs)
- **RNF-001** Validação de CNPJ apenas por formato/comprimento; sem validação de dígitos.
- **RNF-002** Alterações devem seguir TypeScript estrito, sem `any` ou casts proibidos.
- **RNF-003** Dados externos devem ser validados na boundary com Zod.
- **RNF-004** A seção de Company deve seguir os padrões de UI existentes no projeto (tabelas, modais, navegação).

## Abordagem Técnica e Decisões
1) **Entidade Company dedicada**: criar `companies` com campo `type` para classificar como interna, fornecedor ou terceirizada, e relacionar com projetos e orçamentos para padronizar CNPJ em documentos e filtros financeiros.
2) **Company interna em contratos/orçamentos**: apenas companies do tipo `internal` podem ser associadas a projetos e orçamentos, pois representam a entidade contratante. Fornecedores e terceirizadas são usados em custos/despesas, não como emitente de contrato.
3) **Página dedicada de Company**: CRUD completo na seção própria do sistema, com 3 abas por tipo para organização e navegação claras. Evita cadastro inline como único ponto de entrada e centraliza a gestão.
4) **Obrigatoriedade futura**: `company_id` obrigatório apenas para novos registros para evitar migração forçada e manter compatibilidade com dados existentes.
5) **Custos gerais**: uso de `company_id` nulo em custos para manter despesas comuns fora de filtros específicos.
6) **Filtro de impostos**: restringir a custos variáveis do tipo imposto para alinhar com o recorte financeiro definido, sem interferir na lógica atual de `project_services.tax_deduction`.
7) **Integridade na remoção**: company vinculada a projetos/orçamentos/custos não pode ser removida para preservar integridade referencial.

## Estruturas de Dados e Interfaces
### Banco de dados (tabelas/colunas)
- **companies**
  - `id` (PK)
  - `name` (string, obrigatório)
  - `cnpj` (string, obrigatório, único)
  - `responsible` (string, obrigatório)
  - `type` (enum: `internal` | `supplier` | `outsourced`, obrigatório)
  - `created_at`, `updated_at`

- **projects**
  - adicionar/usar `company_id` (FK para `companies.id`)
  - obrigatoriedade apenas para novos projetos (regra de negócio)

- **quotes**
  - adicionar/usar `company_id` (FK para `companies.id`)
  - obrigatoriedade apenas para novos orçamentos (regra de negócio)

- **variable_costs**
  - adicionar `company_id` (FK nullable para `companies.id`)

- **fixed_costs**
  - adicionar `company_id` (FK nullable para `companies.id`)

### Regras de integridade
- `companies.cnpj` único.
- `projects.company_id` e `quotes.company_id` devem referenciar apenas companies do tipo `internal`; podem ser NULL apenas para registros existentes e durante edição até seleção explícita.
- `variable_costs.company_id` e `fixed_costs.company_id` podem referenciar companies de qualquer tipo e podem ser NULL (custos gerais).

### Zod (validações de boundary)
- **CompanyCreateSchema**
  - `name`: string não vazia
  - `cnpj`: string com length/regex de formato (definir padrão aceito)
  - `responsible`: string não vazia
  - `type`: enum (`internal`, `supplier`, `outsourced`)
- **CompanyUpdateSchema**
  - `name`: string não vazia (opcional)
  - `cnpj`: string com length/regex de formato (opcional, único se alterado)
  - `responsible`: string não vazia (opcional)
  - `type`: enum (opcional)
- **ProjectCreate/UpdateSchema**
  - `company_id`: obrigatório para criação; opcional na atualização quando registro existente sem company
  - `company_id` deve referenciar apenas company do tipo `internal` (validação na boundary)
  - regra adicional: se status `finished`, bloquear alteração de `company_id`
- **QuoteCreate/UpdateSchema**
  - `company_id`: obrigatório para criação; opcional na atualização quando registro existente sem company
  - `company_id` deve referenciar apenas company do tipo `internal` (validação na boundary)

### APIs / Endpoints (nível de contrato)
- **Companies**
  - `POST /companies` para criação (na página de Company ou via modal inline).
- `GET /companies` para listar todas (usado em dropdowns de projeto/orçamento, deve filtrar apenas tipo `internal`).
- `GET /companies?type={internal|supplier|outsourced}` para listar por tipo (usado pelas abas da página de Company).
  - `PUT/PATCH /companies/:id` para edição.
  - `DELETE /companies/:id` para remoção (bloqueado se houver vínculos).
- **Projects**
  - `POST /projects` exige `company_id` do tipo `internal`.
  - `PUT/PATCH /projects/:id` permite setar `company_id` se projeto não estiver `finished`; `company_id` deve ser do tipo `internal`.
  - criação via orçamento deve copiar `quotes.company_id`.
- **Quotes**
  - `POST /quotes` exige `company_id` do tipo `internal`.
  - `PUT/PATCH /quotes/:id` permite setar `company_id` quando estiver vazio; `company_id` deve ser do tipo `internal`.

## Ajustes de Queries/Joins
### Receitas
- Filtro por company deve aplicar `payments -> projects.company_id`.
- Quando **sem** filtro, todas as receitas (com ou sem company) aparecem normalmente.

### Despesas
- `fixed_costs` filtrado por `fixed_costs.company_id`.
- `variable_costs` filtrado por `variable_costs.company_id`.
- Quando **com** filtro, **excluir** custos com `company_id` nulo.
- Quando **sem** filtro, incluir todos os custos, incluindo `company_id` nulo (custos gerais).

### Impostos
- Filtro por company usa **apenas** `variable_costs` de tipo imposto.
- Ignorar `project_services.tax_deduction` em qualquer recorte por company.

## Migrações
- Criar tabela `companies` com índices/constraints necessários (incluindo `cnpj` único e `type` como enum/check).
- Adicionar `company_id` em `projects`, `quotes`, `variable_costs`, `fixed_costs`.
- Definir FKs para `companies.id`.
- Não aplicar backfill automático.

## Critérios de Aceite (testáveis)
- **AC-001** Criar um novo projeto sem `company_id` falha com erro de validação.
- **AC-002** Criar um novo orçamento sem `company_id` falha com erro de validação.
- **AC-003** Associar uma company do tipo `supplier` ou `outsourced` a um projeto ou orçamento falha com erro de validação.
- **AC-004** Dropdown de company no fluxo de projeto/orçamento lista apenas companies do tipo `internal`.
- **AC-005** Projetos existentes podem permanecer com `company_id` nulo e permitem edição para definir company (apenas tipo `internal`).
- **AC-006** Ao criar projeto a partir de orçamento, `projects.company_id` = `quotes.company_id`.
- **AC-007** Projeto em status `finished` não permite alteração de `company_id`.
- **AC-008** A página de Company exibe 3 abas: "Interna", "Fornecedores" e "Terceirizados", filtrando corretamente por `type`.
- **AC-009** A aba "Interna" é a aba ativa por padrão ao acessar a página de Company.
- **AC-010** É possível criar uma company pela página de Company preenchendo `name`, `cnpj`, `responsible` e `type`; a company aparece na aba correspondente ao tipo.
- **AC-011** É possível editar os campos de uma company existente pela página de Company.
- **AC-012** Tentar remover uma company vinculada a projeto/orçamento/custo retorna erro e bloqueia a remoção.
- **AC-013** Modal inline no fluxo de projeto/orçamento permite criar company com `type` pré-definido como `internal`; company aparece disponível para seleção imediata.
- **AC-014** PDFs de orçamento e contrato exibem CNPJ da company associada.
- **AC-015** Filtro financeiro por company exibe receitas apenas de pagamentos cujos projetos tenham a company filtrada.
- **AC-016** Filtro financeiro por company exibe despesas apenas de custos fixos/variáveis com `company_id` correspondente.
- **AC-017** Custos com `company_id` nulo aparecem apenas quando **não** há filtro por company.
- **AC-018** Filtro de impostos por company considera apenas `variable_costs` de tipo imposto, ignorando `project_services.tax_deduction`.

## Necessidade de Design/Tasks
- **Design**: Requerido para a página de Company (layout de abas, tabela, formulário de criação/edição, fluxo de remoção).
- **Tasks**: Recomendado criar tasks detalhadas antes da implementação por envolver migrações, endpoints, UI de CRUD com abas, e ajustes financeiros.

## Questões em Aberto
- Nenhuma.

## Observação
Se houver inconsistência nos padrões atuais de PDFs ou geração de documento, isso deve ser sinalizado antes da implementação.
