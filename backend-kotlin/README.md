# Imob-Pro Backend (Kotlin)

Nova implementação do backend do Imob-Pro usando Kotlin e Spring Boot. O sistema original em Node.js permanece intacto na raiz do repositório.

## Stack inicial

- Kotlin 2.2.21
- Java 21
- Spring Boot 3.5.7
- Spring Web, Validation e Data JPA
- PostgreSQL (perfil de produção/desenvolvimento integrado)
- H2 para execução local inicial
- JUnit 5

## Estrutura

```text
backend-kotlin/
├── src/main/kotlin/com/imobpro/backend/
│   ├── health/                  # Endpoint de saúde da API
│   └── ImobProApplication.kt
├── src/main/resources/application.yml
├── src/test/kotlin/com/imobpro/backend/
├── build.gradle.kts
└── settings.gradle.kts
```

## Objetivo do projeto

Construir uma API REST para gestão imobiliária, com cadastro e consulta de imóveis, usuários e clientes, relacionamento entre clientes e imóveis, filtros, autenticação, autorização, validação, tratamento consistente de erros, integração externa, testes e documentação OpenAPI.

## Requisitos

- JDK 21
- Gradle 8.14+ (o wrapper Gradle será adicionado na etapa de preparação do ambiente)

## Executar

Na pasta `backend-kotlin`, após instalar/configurar o Gradle:

```powershell
gradle bootRun
```

A API ficará disponível em `http://localhost:8080`.

### Health check

```http
GET /api/health
```

Resposta aproximada:

```json
{
  "status": "UP",
  "service": "imob-pro-backend",
  "timestamp": "2026-01-01T12:00:00Z"
}
```

## Perfis de banco de dados

- `local` (padrão): H2 em memória para iniciar e testar sem instalar PostgreSQL.
- `postgres`: PostgreSQL. Configure `DATABASE_URL`, `DATABASE_USERNAME` e `DATABASE_PASSWORD`; use `SPRING_PROFILES_ACTIVE=postgres`.

O schema de produção usa `ddl-auto: validate`. Migrações versionadas serão introduzidas antes de persistir dados reais.

## Plano de implementação

1. Fundamentos e estrutura Spring Boot.
2. CRUD de imóveis com DTOs e validação.
3. Persistência relacional e consultas SQL.
4. Usuários, clientes e regras de negócio.
5. Segurança com Spring Security e JWT.
6. Testes unitários e de integração.
7. Integração externa e documentação OpenAPI.
8. Revisão, execução local e preparação para entrevista.

> Este projeto é uma implementação paralela em Kotlin. Ele não substitui nem altera a aplicação Node.js existente.
