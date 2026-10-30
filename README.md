# Finance Project

![CI](https://github.com/kaue-souza7/finance-project/actions/workflows/ci.yml/badge.svg)

Sistema web mobile-first (PWA) de planejamento financeiro mensal.

## Stack

### Backend

- **FastAPI** — API REST
- **PostgreSQL** — banco de dados relacional
- **SQLAlchemy 2.0** — ORM
- **Alembic** — migrações
- **JWT + refresh tokens** — autenticação
- **SlowAPI** — rate limiting

### Frontend

- **React 18** — UI
- **Vite** — bundler
- **TypeScript** — tipagem
- **TailwindCSS** — estilos utilitários
- **React Router** — navegação
- **Vitest + Testing Library** — testes

## Estrutura

```
.
├── backend/          # API FastAPI
│   ├── app/          # código da aplicação
│   ├── alembic/      # migrações
│   └── requirements.txt
├── frontend/         # SPA React
│   └── src/
├── .github/workflows # CI
└── SECURITY.md       # política de segurança
```

## Setup

Requisitos: Python 3.12+, Node 22+ e PostgreSQL.

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
# edite .env com suas credenciais
alembic upgrade head
uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000` e o Swagger em `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend fica em `http://localhost:5173` e faz proxy de `/api` para a API local.

## Testes e qualidade

```bash
# backend
cd backend
ruff check app tests
pytest -q

# frontend
cd frontend
npm run lint
npm run typecheck
npm run test:run
npm run build
```

O CI roda esses comandos em push e pull request.

## Recuperação de senha

Configure as variáveis `SMTP_*` no `backend/.env` para envio real de e-mail.
Sem SMTP, o endpoint continua respondendo de forma genérica e o link é apenas
registrado no log quando `DEBUG=true`.

## Segurança

Nunca commite credenciais reais. Leia [SECURITY.md](SECURITY.md) antes de
alterar configurações de autenticação ou lidar com um vazamento.

## Licença

MIT
