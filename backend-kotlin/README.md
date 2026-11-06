# Imob-Pro Kotlin API

Nova API do Imob-Pro, desenvolvida em Kotlin e Spring Boot. Esta aplicação fica isolada em `backend-kotlin/`; o backend Node.js legado permanece preservado durante a migração.

## Stack inicial

- Kotlin 2.2.21 e Java 21
- Spring Boot 3.5.7
- Spring Web, Security, Validation, Data JPA e Actuator
- PostgreSQL 17
- Flyway
- springdoc-openapi / Swagger UI
- Docker Compose e GitHub Actions

## Executar localmente

Requisitos: JDK 21, Gradle 8.14+ e Docker com Docker Compose.

1. Inicie o banco:

   ```bash
   docker compose up -d postgres
   ```

2. Execute os testes e a aplicação:

   ```bash
   gradle test
   gradle bootRun
   ```

A API ficará em http://localhost:8080. A documentação OpenAPI estará em http://localhost:8080/swagger-ui.html e o health check em http://localhost:8080/actuator/health.

Credenciais locais do PostgreSQL são apenas para desenvolvimento. Em ambientes reais, configure `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` por secrets/variáveis seguras.

## Modelo multiempresa

A fundação cria organizações, usuários, vínculos de associação e eventos de auditoria. O tenant ativo deverá ser resolvido exclusivamente a partir da identidade autenticada e de uma associação ativa; nunca se deve confiar em `organization_id` recebido do cliente.

Todo recurso privado deverá ser consultado com escopo explícito de organização. A autorização será validada também nas relações entre recursos, e testes de isolamento entre organizações serão obrigatórios. A migration inicial não representa o modelo de domínio completo.

## Segurança — estado atual

A configuração inicial é deliberadamente provisória: endpoints de negócio exigem autenticação HTTP Basic e a aplicação é stateless. Antes de expor a API, implementar autenticação definitiva, hash de senha, autorização por permissões/membership, rate limiting, CORS restritivo, política CSRF adequada ao mecanismo escolhido, gestão de segredos e testes de segurança. Não usar credenciais de desenvolvimento em produção.

## Migração

A matriz de compatibilidade está em `../docs/api/compatibility-matrix.md`. Os endpoints serão migrados em fatias verticais, com testes de contrato e validação de isolamento multiempresa antes de substituir qualquer fluxo do sistema legado.
