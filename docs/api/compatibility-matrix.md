# Matriz de compatibilidade — Imob-Pro Kotlin API

> Status: especificação inicial da Etapa 0. Fonte: `server.js` e `public/app.js` da branch `main` do repositório original. A matriz registra as 67 rotas Express encontradas por inspeção estática. Campos marcados como **confirmar** dependem de validação com a interface em execução e/ou dos trechos completos dos handlers.

## Regras de compatibilidade

- Preservar os caminhos e métodos HTTP atuais durante a primeira migração, evitando alterações em `public/app.js`.
- Preservar nomes de campos JSON existentes (snake_case onde já usado) na camada de compatibilidade.
- Preservar códigos HTTP e semântica de erros sempre que possível; padronizar erros internamente em `ProblemDetail` sem quebrar o contrato externo.
- A autenticação será migrada de cookie de sessão Express para access/refresh tokens. A estratégia de transporte (cookie HttpOnly ou bearer) será fechada antes da implementação; o frontend não deve receber refresh token em JavaScript.
- Rotas administrativas passam a ser escopadas pela organização ativa e pelas permissões do membership.
- Nenhuma rota privada poderá confiar em `organization_id`, `owner_id`, `user_id` ou papel enviados pelo cliente sem validação de autorização no servidor.
- Para endpoints públicos, retornar somente dados publicados e campos públicos.

## Legenda de autorização

- **Público**: sem autenticação.
- **Autenticado**: usuário autenticado, com propriedade/associação do recurso validada.
- **Owner**: anunciante/owner com membership e escopo da organização.
- **Agent**: corretor/atendente autorizado na organização.
- **Staff**: papel operacional com permissão específica; não será um papel universal.
- **Manage**: administrador/gestor com permissão explícita.
- **Compat**: rota externa mantida para a interface atual; implementação Kotlin.

## Endpoints (67)

| # | Método e rota atual | Acesso atual observado | Entrada principal observada | Resposta/efeito observado | Destino Kotlin / regra multiempresa |
|---:|---|---|---|---|---|
| 01 | GET `/api/health` | Público | — | `ok`, serviço, ambiente e timestamp | HealthController + Actuator; sem dados de tenant |
| 02 | GET `/api/settings` | Público | — | Mapa de configurações públicas | SettingsQuery; separar configurações globais das configurações por organização |
| 03 | GET `/api/auth/me` | Público (retorna sessão ou null) | Cookie de sessão | Usuário da sessão ou `null` | IdentityController; retornar usuário e contexto ativo, sem segredos |
| 04 | POST `/api/auth/login` | Público | `email`, `password` | Usuário público; cria sessão | AuthController; localizar identidade, validar membership e emitir tokens |
| 05 | POST `/api/auth/register` | Público | `name`, `email`, `password` (mín. 8), `phone?` | 201 + usuário; cria customer | RegistrationUseCase; criar customer global ou convite de organização, nunca membership privilegiado |
| 06 | POST `/api/auth/logout` | Público no Express | Sessão atual | `{ok:true}`; destrói sessão | TokenController; revogar refresh token/sessão atual |
| 07 | POST `/api/auth/admin-recover` | Público, condicionado por ambiente/chave | `email`, `password`, `recoveryKey` | Redefine senha admin e invalida sessões | Remover do fluxo público; operação break-glass desabilitada por padrão, auditada e restrita à operação |
| 08 | POST `/api/auth/change-password` | Autenticado | `currentPassword`, `newPassword` | `{ok:true}` | PasswordUseCase; invalidar refresh tokens antigos e auditar |
| 09 | POST `/api/auth/forgot-password` | Público | `email` | Resposta genérica; envio de link/token; token de dev somente fora de produção | PasswordRecoveryUseCase; resposta anti-enumeração, token hash, expiração e uso único |
| 10 | POST `/api/auth/reset-password` | Público | `token`, `password` | `{ok:true,message}` | PasswordRecoveryUseCase; validar token hash/expiração/uso e revogar sessões |
| 11 | GET `/api/properties` | Público; staff vê estados adicionais | Filtros: `status`, `purpose`, `type`, `city`, `neighborhood`, `minPrice`, `maxPrice`, `bedrooms`, `parking`, `q` | Lista normalizada, limite atual 100 | PropertySearch; público somente listings publicados; escopo org para consultas internas; paginação futura |
| 12 | GET `/api/properties/:id` | Público com restrição de publicação | `id` | Imóvel normalizado ou 404 | PropertyQuery; público só listing publicado; dados privados filtrados |
| 13 | POST `/api/leads` | Público | `name`, `whatsapp`, `email?`, `property_id?`, `message?`, `source?` | 201 + `id`; atribuição round-robin atual e tarefa/notificação | LeadIntake; resolver organização pelo listing; atribuição dentro da organização; proteção anti-spam |
| 14 | GET `/api/me/favorites` | Autenticado | Usuário da sessão | Lista de imóveis favoritados | FavoritesQuery; favoritos do usuário e somente listings visíveis na organização/portal |
| 15 | POST `/api/me/favorites/:propertyId` | Autenticado | `propertyId` | `{ok:true}` (idempotência desejável) | AddFavorite; validar listing público e organização |
| 16 | DELETE `/api/me/favorites/:propertyId` | Autenticado | `propertyId` | `{ok:true}` | RemoveFavorite; validar propriedade do favorito |
| 17 | GET `/api/me/collections` | Autenticado | Usuário da sessão | Coleções com itens/imóveis | CollectionsQuery; coleção pertence ao usuário; validar visibilidade dos imóveis |
| 18 | POST `/api/me/collections` | Autenticado | `name`, `description?` | 201 + `id` | CreateCollection; limite/validação e ownership |
| 19 | POST `/api/me/collections/:id/items` | Autenticado | `property_id`, `comment?` | `{ok:true}` | AddCollectionItem; coleção e listing acessíveis ao usuário |
| 20 | DELETE `/api/me/collections/:id/items/:propertyId` | Autenticado | `id`, `propertyId` | `{ok:true}` | RemoveCollectionItem; ownership da coleção |
| 21 | GET `/api/me/saved-searches` | Autenticado | Usuário da sessão | Lista de buscas salvas | SavedSearchQuery; escopo por usuário |
| 22 | POST `/api/me/saved-searches` | Autenticado | `name?`, `filters?`, `frequency?` | 201 + `id` | CreateSavedSearch; validar filtros e frequência permitida |
| 23 | DELETE `/api/me/saved-searches/:id` | Autenticado | `id` | `{ok:true}` | DeleteSavedSearch; ownership |
| 24 | GET `/api/me/notifications` | Autenticado | Usuário da sessão | Até 50 notificações | NotificationQuery; filtrar recipient e organização |
| 25 | PATCH `/api/me/notifications/:id/read` | Autenticado | `id` | `{ok:true}` | MarkNotificationRead; update condicionado ao usuário e tenant |
| 26 | GET `/api/owner/properties` | Owner | Usuário da sessão | Imóveis do owner | OwnerPropertyQuery; owner membership na organização ativa |
| 27 | POST `/api/owner/properties` | Owner | Payload do imóvel: título, tipo, finalidade, cidade, bairro e campos opcionais | 201 + imóvel; status inicial pending | CreateProperty; organization_id derivado do contexto; nunca aceitar tenant do body |
| 28 | PATCH `/api/owner/properties/:id` | Owner + proprietário do registro | Payload parcial do imóvel | Imóvel atualizado e enviado para análise | UpdateProperty; tenant + owner verificados na mesma consulta |
| 29 | POST `/api/owner/properties/:id/images` | Owner + proprietário do imóvel | Multipart `images[]`, até 20 arquivos | Imóvel normalizado atualizado | UploadPropertyMedia; validar MIME real, tamanho, ownership e storage segregado |
| 30 | GET `/api/agent/summary` | Agent | Usuário da sessão | Contagem de leads, leads abertos, tarefas e mensagens não lidas | AgentDashboardQuery; todos os agregados limitados à organização e ao agente |
| 31 | GET `/api/agent/leads` | Agent | Usuário da sessão | Leads atribuídos ao agente, até 100 | AgentLeadQuery; tenant + assigned_to |
| 32 | GET `/api/agent/tasks` | Agent | Usuário da sessão | Tarefas atribuídas, até 100 | AgentTaskQuery; tenant + user_id |
| 33 | PATCH `/api/agent/tasks/:id` | Agent + dono da tarefa | `status?` | `{ok:true}` | UpdateTask; validar transições de status, tenant e responsável |
| 34 | GET `/api/admin/stats` | Staff | — | Contagens de imóveis, anúncios, leads, visitas e usuários | OrganizationDashboardQuery; métricas exclusivamente da organização ativa |
| 35 | GET `/api/admin/users` | Manage | — | Lista de usuários sem hash de senha | OrganizationMemberQuery; listar memberships da organização |
| 36 | POST `/api/admin/users` | Manage | `name`, `email`, `password`, `role?`, `phone?` | 201 + `id` | InviteMember/CreateMember; convite preferencial, papel permitido por quem convida |
| 37 | PATCH `/api/admin/users/:id` | Manage | `name?`, `phone?`, `role?` | `{ok:true}` | UpdateMembership; alterar papel do vínculo, não o papel global do usuário |
| 38 | GET `/api/admin/leads` | Staff | — | Leads com imóvel e responsável | OrganizationLeadQuery; tenant obrigatório |
| 39 | PATCH `/api/admin/leads/:id` | Staff | `status`, `assigned_to?` | `{ok:true}` | UpdateLead; status permitido e responsável membro ativo da organização |
| 40 | GET `/api/admin/properties` | Staff | — | Lista de imóveis com anunciante | OrganizationPropertyQuery; tenant obrigatório |
| 41 | POST `/api/admin/properties` | Manage | Payload de imóvel + `owner_id?`, `status?`, `cover_image?` | 201 + imóvel | CreatePropertyByStaff; validar owner membership; status conforme permissão |
| 42 | PATCH `/api/admin/properties/:id` | Manage | Campos editáveis do imóvel | Imóvel atualizado | UpdatePropertyByStaff; tenant obrigatório e audit trail |
| 43 | PATCH `/api/admin/properties/:id/status` | Manage | `status`: draft/pending/published/paused/sold/rented/archived | `{ok:true}` + notificação ao anunciante | ChangeListingStatus; status pertence ao listing, não ao imóvel; publicar exige policy |
| 44 | POST `/api/admin/properties/:id/images` | Manage | Multipart `images[]`, até 20 | Imóvel normalizado atualizado | UploadPropertyMedia; tenant, permissão e storage segregado |
| 45 | POST `/api/visits` | Autenticado | `property_id`, `visit_date`, `notes?` | 201 + `id` e mensagem | RequestVisit; listing publicado, organização resolvida pelo listing e disponibilidade validada |
| 46 | GET `/api/admin/visits` | Staff | — | Visitas com lead, imóvel e corretor | OrganizationVisitQuery; tenant obrigatório |
| 47 | POST `/api/admin/visits` | Staff | `visit_date`, `lead_id?`, `property_id?`, `customer_id?`, `agent_id?`, `notes?` | 201 + `id`; notificação ao cliente | ScheduleVisit; validar todos os vínculos no mesmo tenant e evitar conflito de agenda |
| 48 | GET `/api/admin/tasks` | Staff | — | Tarefas com usuário, lead e imóvel | OrganizationTaskQuery; tenant obrigatório |
| 49 | POST `/api/admin/tasks` | Staff | `title`, `user_id?`, `lead_id?`, `property_id?`, `due_at?`, `priority?`, `notes?` | 201 + `id` | CreateTask; responsáveis e referências devem pertencer ao tenant |
| 50 | PATCH `/api/admin/tasks/:id` | Staff | `status?` | `{ok:true}` | UpdateTaskByStaff; tenant e transição válida |
| 51 | PATCH `/api/admin/settings` | Manage | Mapa chave/valor | Configurações atualizadas | OrganizationSettings; separar configurações globais e por organização |
| 52 | GET `/api/admin/activity` | Staff | — | Até 100 eventos com nome do usuário | AuditEventQuery; tenant obrigatório, sem expor dados sensíveis |
| 53 | POST `/api/properties/:id/view` | Público | `source?` | `{ok:true}`; registra view e sessão | RecordListingView; só listing publicado; rate-limit e minimização de dados |
| 54 | GET `/api/admin/property-analytics/:id` | Staff | `id` | Imóvel e contagens de views únicas, favoritos, leads e visitas | ListingAnalyticsQuery; validar tenant antes de agregar |
| 55 | GET `/api/admin/messages` | Staff | — | Até 200 mensagens com remetente/destinatário/imóvel | OrganizationMessageAdminQuery; tenant obrigatório e acesso restrito |
| 56 | GET `/api/messages/contacts` | Autenticado | Usuário da sessão | Lista de contatos permitidos | MessageContactsQuery; somente usuários do mesmo tenant e regras de relacionamento |
| 57 | GET `/api/messages` | Autenticado | Filtros/contatos conforme handler; confirmar | Conversas/mensagens do usuário | ConversationQuery; membership, tenant e participantes autorizados |
| 58 | GET `/api/messages/unread` | Autenticado | Usuário da sessão | `{count}` | UnreadMessageCount; recipient + tenant |
| 59 | POST `/api/messages` | Autenticado | `recipient_id`, `body` (máx. 2.000), `property_id?`, `lead_id?` | 201 + `id`, `created_at`; notifica destinatário | SendMessage; remetente, destinatário, lead e imóvel no mesmo tenant |
| 60 | GET `/api/me/profile` | Autenticado | Usuário da sessão | Perfil sem hash | ProfileQuery; identidade global, retornar memberships/contexto sem dados alheios |
| 61 | PATCH `/api/me/profile` | Autenticado | `name`, `phone` | Usuário público atualizado | UpdateProfile; atualizar identidade global e sincronizar representação de sessão |
| 62 | GET `/api/me/export` | Autenticado | Usuário da sessão | Exporta perfil, favoritos, buscas e coleções | PersonalDataExport; exportação completa conforme base legal e LGPD |
| 63 | POST `/api/me/privacy-requests` | Autenticado | `type`: access/correction/deletion/portability/revocation/information; `details?` | 201 + `id`; notificação | CreatePrivacyRequest; registrar titular, escopo, status, prazo e trilha de auditoria |
| 64 | GET `/api/admin/privacy-requests` | Manage | — | Solicitações com dados do titular | OrganizationPrivacyRequestQuery; escopo e acesso restrito |
| 65 | GET `/api/admin/automations` | Manage | — | Lista de regras de automação | AutomationRuleQuery; regras pertencem à organização |
| 66 | POST `/api/admin/automations` | Manage | `name`, `trigger_key`, `action_key` | 201 + `id` | CreateAutomationRule; catálogo de gatilhos/ações permitidos e tenant |
| 67 | PATCH `/api/admin/automations/:id` | Manage | `enabled` | `{ok:true}` | ToggleAutomationRule; tenant, autorização e validação de execução |

## Observações importantes da inspeção

1. A contagem de 67 considera as declarações literais `app.get/post/patch/delete` encontradas em `server.js`; a rota curinga final `app.get(/.*/...)` não é endpoint de negócio.
2. Os handlers de mensagens e contatos precisam de leitura completa e teste com o frontend para fechar filtros, ordenação e formato exato.
3. A aplicação atual mistura `properties` e anúncio. A API nova separará `Property` de `Listing`; a camada Compat fará a projeção do formato antigo.
4. Os nomes `admin`, `manager`, `editor`, `agent`, `owner`, `customer` são papéis legados. A autorização nova será permission-based por membership; não mapear automaticamente papel legado para acesso amplo.
5. Não foi executada uma suíte de testes contra o servidor nesta etapa. A matriz é uma especificação baseada em código estático e deve ser validada com testes de contrato antes da troca do backend.

## Critério de aceite da compatibilidade

- [ ] Os 67 endpoints possuem teste de contrato ou justificativa documentada de remoção.
- [ ] Os fluxos do frontend atual passam sem alteração visual ou de navegação.
- [ ] Todos os endpoints privados têm teste negativo de acesso cross-tenant.
- [ ] Endpoints públicos nunca retornam CRM, contatos privados, dados internos ou anúncios não publicados.
- [ ] Uploads e mensagens validam tenant de todas as referências relacionadas.
- [ ] Códigos HTTP, nomes de campos e comportamento de paginação/ordenação estão documentados.
