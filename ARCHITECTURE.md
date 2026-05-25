# Arquitetura

## Visão Geral

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  React SPA  │────▶│  FastAPI     │────▶│ PostgreSQL │
│  (Vite)     │     │  (REST)      │     │            │
└─────────────┘     └──────────────┘     └────────────┘
       │                    │
       │ JWT Token          │ JWT Auth
       └────────────────────┘
```

## Backend — Clean Architecture

```
backend/
├── app/
│   ├── api/              # Interface HTTP
│   │   ├── v1/           #   Rotas versionadas
│   │   └── deps.py       #   Dependências (get_db, get_current_user)
│   ├── core/             # Config e segurança
│   │   ├── config.py     #   Settings (.env)
│   │   └── security.py   #   JWT + bcrypt
│   ├── database/         # Banco de dados
│   │   └── session.py    #   Engine + Session + Base
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── repositories/     # Acesso a dados (Repository Pattern)
│   ├── services/         # Lógica de negócio
│   ├── utils/            # Helpers
│   └── main.py           # App factory
```

### Decisões

- **Rotas em `api/v1/`** — versionamento explícito desde o início.
- **Core separado** — `security.py`, `config.py` isolados para reuso e teste.
- **Repository Pattern** — substitui CRUD genérico; cada entidade tem seu repositório com métodos explícitos, facilitando testes com mocks.
- **Services layer** — orquestra regras de negócio entre repositórios, mantendo as rotas enxutas.
- **Schemas separados de Models** — evita acoplamento com o banco; schemas definem a interface pública da API.
- **Dependências centralizadas** — `api/deps.py` contém `get_db()` e `get_current_user()`, injetados automaticamente pelo FastAPI.

## Frontend — Feature-based (futuro)

```
frontend/src/
├── components/    # Componentes reutilizáveis
├── pages/         # Páginas/Rotas
├── hooks/         # Custom hooks
├── services/      # API client
├── types/         # TypeScript types
└── utils/         # Helpers
```

### Decisões

- **Feature-based** — cada funcionalidade futura (ex: `auth/`, `budget/`) terá sua pasta dentro de `pages/` com componentes, hooks e types co-localizados.
- **Services layer** — centraliza chamadas HTTP com axios/fetch, facilitando mocking e troca de backend.
- **Vite** — build rápido, HMR nativo, substitui CRA (depreciado).

## Fluxo de Dados

```
HTTP Request
  → Router (api/v1/)
    → Dependencies (deps.py: auth, db session)
      → Service (services/)
        → Repository (repositories/)
          → Model (models/) → SQLAlchemy → PostgreSQL
```

1. Requisição chega ao router versionado em `api/v1/`
2. FastAPI resolve dependências (DB session, current user) via `api/deps.py`
3. Router chama o **Service** correspondente (lógica de negócio)
4. Service chama o **Repository** (operações de banco)
5. Repository usa o **Model** SQLAlchemy para ler/escrever no PostgreSQL
6. Resposta trafega de volta pelo mesmo caminho, serializada via **Schema** Pydantic

## Migrações (Alembic)

```bash
cd backend
alembic revision --autogenerate -m "descrição"
alembic upgrade head
```
