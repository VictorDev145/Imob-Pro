# Imob Pro 4.0 — pacote comercial para produção

Plataforma imobiliária com portal público, CRM, atendimento, área do cliente, área exclusiva do anunciante, publicação de imóveis com imagens, visitas, favoritos, buscas salvas, coleções, notificações, analytics, automações e recursos de privacidade.

## Requisitos

- Node.js 20+ (recomendado Node 24 LTS/current compatível)
- npm
- armazenamento persistente para `imobpro.sqlite` e `uploads/`
- HTTPS em produção
- domínio próprio recomendado

## Desenvolvimento local

```powershell
npm install
copy .env.example .env
```

Para testar localmente, ajuste no `.env`:

```text
NODE_ENV=development
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@imobpro.local
ADMIN_PASSWORD=admin12345
SESSION_SECRET=uma-chave-local-com-pelo-menos-32-caracteres
```

Depois:

```powershell
npm start
```

Acesse `http://localhost:3000`.

## Produção

Defina obrigatoriamente:

```text
NODE_ENV=production
PORT=3000
SESSION_SECRET=<segredo aleatório com 32+ caracteres>
ADMIN_EMAIL=<e-mail administrativo real>
ADMIN_PASSWORD=<senha forte com 10+ caracteres>
APP_URL=https://seudominio.com
```

Em produção a aplicação **não inicia** se `SESSION_SECRET`, credenciais administrativas ou `APP_URL` HTTPS estiverem ausentes/inadequados.

Configure SMTP para recuperação de senha e notificações por e-mail:

```text
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=Imob Pro <no-reply@seudominio.com>
```

## Armazenamento persistente

Este projeto usa SQLite e armazenamento local de imagens. Em um host com filesystem efêmero, não coloque o sistema em produção sem um volume/disco persistente.

Persistir:

- `imobpro.sqlite`
- `imobpro.sqlite-shm`
- `imobpro.sqlite-wal`
- `uploads/`

Faça backups externos regulares do banco e das imagens.

## Docker

Existe um `Dockerfile` pronto. O container continua precisando de um volume persistente para `/app/imobpro.sqlite` e `/app/uploads`.

## Health check

`GET /api/health` retorna o estado básico da aplicação e pode ser usado pelo provedor de hospedagem para health checks.

## Segurança incluída

- Helmet
- cookies HttpOnly/SameSite e Secure em produção
- sessões persistidas em SQLite
- rotação de sessão no login/cadastro
- bcrypt para senhas
- rate limiting de autenticação
- tokens de recuperação armazenados com hash e expiração
- validação de MIME/tamanho para imagens
- autorização server-side por papel e propriedade
- proteção de propriedade do anunciante: ele só edita os próprios anúncios
- cabeçalhos de segurança
- respostas de API sem cache
- tratamento de erros de upload
- auditoria e recursos de privacidade

## Responsividade

A interface foi construída para PC, notebook, tablet e celular, com reorganização de layouts, controles adequados para toque, galerias responsivas e suporte a teclado/foco.

## Antes de entregar a um cliente

1. configurar domínio e HTTPS;
2. gerar `SESSION_SECRET` aleatório;
3. trocar credenciais administrativas;
4. configurar SMTP;
5. configurar volume/disco persistente;
6. configurar backup externo;
7. configurar domínio/APP_URL;
8. revisar política de privacidade, termos, retenção e canal LGPD do cliente;
9. revisar identidade visual, dados de contato e conteúdo do cliente;
10. executar o fluxo completo: cadastro → login → anúncio → fotos → análise → publicação → lead → visita → CRM → atendimento → reinício do servidor.
