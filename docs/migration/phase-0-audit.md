# Etapa 0 — Auditoria e especificação

## Escopo aprovado

- Multiempresa com isolamento de dados por organização.
- Preservar a interface atual e integrá-la à API Kotlin.
- Manter o backend original Node/SQLite intacto durante a construção.
- Novo backend em repositório separado quando a fundação for iniciada.

## Fontes inspecionadas

Branch `main` do repositório original:
- `server.js`
- `package.json`
- `public/index.html`
- `public/app.js`
- `.gitignore`

A inspeção estática identificou 67 rotas de API literais e 21 tabelas SQL declaradas. Não foram inspecionados arquivos locais não versionados, conteúdo do SQLite real, diretório de uploads em produção, nem comportamento por execução automatizada.

## Achados principais

- Express 5 + SQLite com boa amplitude funcional.
- Backend concentrado em `server.js`.
- Frontend vanilla JS com helper `api(url,opt)` e chamadas `/api/...`.
- Sessões Express e bcryptjs.
- Papéis legados: admin, manager, editor, agent, owner, customer.
- Não foi identificada coluna `organization_id` ou `tenant_id` no esquema analisado.
- Não foi identificado script de testes no package.json.
- Esquema SQL inicializado diretamente no backend, sem Flyway ou migrations versionadas.
- Upload local via Multer; validação atual usa extensão/MIME informado e precisa ser reforçada.
- Analytics, mensagens, notificações, LGPD, tarefas e automações fazem parte do escopo funcional.

## Entregáveis da Etapa 0

- [x] Inventário funcional inicial.
- [x] Inventário das 67 rotas.
- [x] Inventário das tabelas (ver relatório da auditoria no histórico da conversa; detalhamento será expandido no schema design).
- [x] Decisão de tenancy.
- [x] Decisão de preservar frontend.
- [x] Matriz inicial de compatibilidade: [API Compatibility Matrix](../api/compatibility-matrix.md).
- [x] Especificação de tenancy e segurança: [Tenancy & Security](../architecture/tenancy-and-security.md).
- [ ] Validar todos os contratos com frontend em execução.
- [ ] Conferir migrations e índices alvo.
- [ ] Inspecionar o SQLite real e os uploads reais.
- [ ] Aprovar mapeamento de papéis legados para permissões.
- [ ] Aprovar política de autenticação frontend (cookie HttpOnly ou bearer + BFF).
- [ ] Criar testes de contrato como baseline.

## Portão de entrada da Etapa 1

A Etapa 1 pode começar com o esqueleto técnico, mas nenhum módulo de negócio deve ser considerado concluído até:
- contrato compatível documentado;
- tenant context obrigatório nos casos de uso organizacionais;
- migrations iniciais revisadas;
- CI executando build, lint e testes;
- teste automatizado cross-tenant funcionando.

## Não objetivos desta etapa

- Não alterar `server.js` ou `public/app.js`.
- Não substituir SQLite no produto atual.
- Não apagar ou reescrever dados.
- Não criar migração automática sem inspeção do banco real.
- Não introduzir microsserviços.
