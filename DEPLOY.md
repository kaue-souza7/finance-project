# Deploy no Render

## Diagnóstico

O repositório não possui `render.yaml`, `Dockerfile` nem `Procfile`. Isso significa
que build, start e health check são configurados no dashboard do Render, e que
**nada no deploy executava `alembic upgrade head` automaticamente**.

Essa era a causa do erro `relation "refresh_tokens" does not exist`: o banco
estava na revisão `0015`, enquanto o código já esperava a `0016`.

## Configuração recomendada do serviço

No Render, no serviço da API:

- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Pre-Deploy Command:** `python -m scripts.migrate`
- **Health Check Path:** `/health`

O `preDeployCommand` aplica as migrations antes de a nova versão receber
tráfego. Se ele não estiver disponível no seu plano, o startup da aplicação
também executa as migrations (controlado por `RUN_MIGRATIONS_ON_STARTUP`).

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://...
# Opcional, para migrations via conexão direta (sem pooler)
DIRECT_DATABASE_URL=
RUN_MIGRATIONS_ON_STARTUP=true
SECRET_KEY=<segredo-aleatorio-forte>
CORS_ORIGINS=https://seu-frontend
FRONTEND_URL=https://seu-frontend
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_USE_TLS=true
DEBUG=false
RATE_LIMIT_ENABLED=true
```

Se o banco for Supabase e o `DATABASE_URL` usar o pooler (porta 6543),
configure `DIRECT_DATABASE_URL` com a conexão direta (porta 5432). O app usa o
pooler; o Alembic usa a conexão direta.

## Segurança das migrations

- O startup adquire um **advisory lock do PostgreSQL** antes de rodar o Alembic.
  Se duas instâncias subirem juntas, uma espera a outra.
- Se o banco já está na revisão head, o Alembic nem é executado.
- Se a migration falha, o startup falha e a instância não recebe tráfego.
- Nada é apagado/recriado. As migrations são incrementais e reversíveis.

## Deploy

1. Faça commit e push.
2. Confirme que o `DATABASE_URL` do Render aponta para o banco correto.
3. Faça o deploy. O pre-deploy ou o startup aplica `0016`.
4. Verifique:
   ```bash
   curl https://finance-api.onrender.com/health
   # {"status":"ok","database":"ok"}

   cd backend
   alembic current
   alembic heads
   ```
5. Teste login e refresh token.

## Se o pre-deploy não existir no plano

Execute no Shell do Render (ou localmente, com o `DATABASE_URL` de produção):

```bash
cd backend
python -m scripts.migrate
```

Não rode `alembic upgrade head` apontando para um banco diferente do que o
Render usa. Confirme o host do `DATABASE_URL` antes.
