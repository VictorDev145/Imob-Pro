# Arquitetura de tenancy e segurança — Imob-Pro Kotlin API

## Decisões aprovadas

- Produto multiempresa (multi-tenant).
- Preservar o frontend atual em HTML/CSS/JavaScript.
- Backend novo em Kotlin + Spring Boot, como monólito modular.
- PostgreSQL como banco principal e Flyway para migrations.
- Não modificar a aplicação Node/SQLite durante a fase de construção da API Kotlin.

## 1. Modelo de tenancy

### Entidades de identidade e organização

- `users`: identidade global (email único, credenciais, nome e telefone).
- `organizations`: imobiliária/empresa cliente.
- `memberships`: associação de usuário a organização, com status e papel.
- `roles` / `permissions`: catálogo de papéis e permissões.
- `membership_roles`: papéis atribuídos ao vínculo.
- `refresh_tokens`: sessões renováveis, armazenadas como hash.
- `organization_invitations`: convites com token hash, expiração e uso único.

Um usuário pode participar de várias organizações. O contexto ativo será selecionado entre memberships válidos, não arbitrariamente por um ID enviado pelo cliente.

### Entidades de negócio

Entidades operacionais devem carregar `organization_id NOT NULL` quando pertencem a uma imobiliária:

- properties, listings, property_media
- leads, tasks, visits
- messages (com tenant explícito e participantes validados)
- notifications organizacionais
- settings organizacionais
- automation_rules
- audit_events
- privacy_requests organizacionais, quando relacionadas à operação da imobiliária

Dados pessoais globais (ex.: identidade do usuário e credenciais) não devem ser duplicados por tenant. Relações de CRM devem apontar para organização e identidade de usuário/contato de forma explícita.

## 2. Regras obrigatórias de isolamento

1. Resolver o usuário pelo principal autenticado.
2. Resolver a organização ativa a partir de membership ativo e autorizado.
3. Nunca confiar em `organization_id` enviado em body, query string ou path para autorizar acesso.
4. Todas as consultas de recursos privados incluem `organization_id = :activeOrganizationId`.
5. IDs de recursos relacionados são validados no mesmo tenant (lead, imóvel, visita, tarefa, mídia, mensagem, usuário membro).
6. Operações de update/delete verificam tenant e permissão na mesma operação lógica.
7. Jobs, notificações, eventos e tarefas assíncronas carregam explicitamente o tenant.
8. Rotas públicas consultam somente listings publicados e projetam somente campos públicos.
9. Logs não registram senha, token, recovery key, conteúdo privado desnecessário ou dados sensíveis.
10. Testes automatizados cobrem leitura, escrita, upload, analytics e referências cruzadas entre dois tenants.

### Defesa em profundidade

- Camada de aplicação: `CurrentOrganization` obrigatório em casos de uso organizacionais.
- Repositórios: métodos explicitamente tenant-scoped; evitar `findById(id)` em recursos de tenant.
- Banco: índices compostos começando por `organization_id`; chaves únicas compostas e FKs compostas quando apropriado.
- PostgreSQL RLS: avaliar como defesa adicional. Se habilitado, configurar tenant por transação/conexão e garantir limpeza do contexto em pool; não substituir autorização na aplicação.
- Auditoria: registrar ator, tenant, ação, entidade, resultado e timestamp.

## 3. Modelo de domínio

### Property versus Listing

`Property` representa o imóvel cadastrado e suas características físicas/legais. `Listing` representa a oferta publicada, seu preço comercial, finalidade, status, validade e canal de publicação.

Um imóvel pode ter mais de um listing ao longo do tempo, conforme regras do produto. Status como draft, pending, published, paused, sold, rented e archived pertencem ao ciclo do anúncio/listing. Alterações críticas devem gerar histórico.

### Mídia

`PropertyMedia` guarda metadados, chave do objeto, tipo, tamanho, ordem, checksum e proprietário lógico. O binário fica em storage (local no desenvolvimento; object storage em produção). Chaves de objeto incluem identificador opaco da organização. Download privado exige autorização; mídia pública só é servida se associada a listing publicado.

### CRM e comunicação

Leads, tasks, visits e mensagens são sempre tenant-scoped. Participantes de mensagens devem pertencer à organização, salvo conversa pública explicitamente modelada. Atribuição round-robin será substituída por serviço transacional com elegibilidade, concorrência e fallback.

## 4. Autorização

Papéis legados não serão reproduzidos como autorização global. O modelo novo usa permissões, por exemplo:

- `organization.read`, `organization.update`
- `members.read`, `members.invite`, `members.update_role`
- `properties.read`, `properties.create`, `properties.update`, `properties.archive`
- `listings.publish`, `listings.moderate`
- `leads.read_assigned`, `leads.read_all`, `leads.assign`, `leads.update`
- `visits.read`, `visits.schedule`, `visits.manage`
- `tasks.read_assigned`, `tasks.manage`
- `messages.read`, `messages.send`
- `analytics.read`, `audit.read`, `settings.manage`

Papéis iniciais sugeridos: OWNER, ADMIN, MANAGER, EDITOR, AGENT, LISTING_OWNER. A matriz papel-permissão será versionada e testada. CUSTOMER é usuário do portal, não membro operacional por padrão.

## 5. Autenticação

- Senhas com BCrypt (work factor configurável) ou Argon2id após benchmark.
- Access token curto; refresh token rotativo, opaco ou JWT com estado de revogação; persistir hash do refresh token.
- Refresh token em cookie HttpOnly, Secure e SameSite apropriado, ou fluxo bearer cuidadosamente definido. Nunca expor refresh token ao JavaScript.
- Proteção CSRF se autenticação por cookie.
- Rate limit para login, recuperação, registro e envio de mensagens/leads.
- Recuperação com token aleatório, hash persistido, expiração, uso único e resposta anti-enumeração.
- Logout revoga a sessão/refresh token.
- Troca de senha revoga sessões conforme política.
- Admin recovery break-glass desabilitado por padrão; sem segredo padrão em ambiente.

## 6. API e compatibilidade

A primeira versão Kotlin mantém os paths legados `/api/...` usados pelo frontend. Controllers delegam para casos de uso e DTOs de compatibilidade. Contratos internos podem evoluir sem obrigar mudança imediata no frontend.

A matriz de endpoints está em [compatibility-matrix.md](../api/compatibility-matrix.md).

## 7. Stack

- Kotlin 2.2.x, Java 21, Spring Boot 3.5.x.
- Spring Web, Validation, Security, Data JPA.
- PostgreSQL + Flyway.
- Springdoc OpenAPI.
- JUnit 5, MockK, Testcontainers.
- Detekt + ktlint.
- Docker Compose e GitHub Actions.
- Redis apenas quando houver caso concreto (cache, rate limit compartilhado ou filas leves); não introduzir como requisito inicial.
- Mensageria assíncrona só quando os casos de uso justificarem.

## 8. Testes mínimos de segurança multiempresa

Com tenants A e B:

- usuário A não lista, lê, atualiza ou exclui recursos B.
- usuário A não associa lead B a imóvel A.
- usuário A não agenda visita em listing B.
- usuário A não envia mensagem a membro B por endpoint interno.
- usuário A não acessa analytics, mídia, notificações, tarefas ou auditoria B.
- mudar IDs no path/body/query não contorna tenant.
- usuário removido/suspenso perde acesso imediatamente.
- organização suspensa não permite operações operacionais.
- endpoints públicos retornam somente listings publicados e projeção pública.

## 9. Migração de dados

A migração do SQLite não será automática nem destrutiva. Antes dela:
1. inventariar dados reais e integridade do banco local;
2. decidir a organização inicial para os registros legados;
3. mapear users/roles antigos para memberships;
4. separar property e listing;
5. preservar IDs legados como `legacy_id` quando necessário;
6. migrar arquivos e validar checksums;
7. gerar relatório de contagem e órfãos;
8. executar ensaio de migração em cópia;
9. validar com usuário antes de qualquer cutover.

Não executar migração de dados de produção sem backup testado e plano de rollback.
