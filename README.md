# Finance Project

Sistema web mobile-first de planejamento financeiro mensal.

## Stack

### Backend

- **FastAPI** — framework web assíncrono
- **PostgreSQL** — banco de dados relacional
- **SQLAlchemy 2.0** — ORM
- **Alembic** — migrações
- **JWT** — autenticação

### Frontend

- **React 18** — UI
- **Vite** — bundler
- **TypeScript** — tipagem
- **TailwindCSS** — estilos utilitários
- **React Router** — navegação

## Estrutura

```
.
├── backend/          # API FastAPI
│   ├── app/          # código da aplicação
│   └── requirements.txt
├── frontend/         # SPA React
│   └── src/
└── docs/             # documentação
```

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
# edite .env com suas credenciais
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Licença

MIT
