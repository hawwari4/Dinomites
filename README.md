# QSTP Connect

Internship operations platform for Qatar Science & Technology Park — matches interns,
startups, and universities across QSTP-Funded and Work Placement tracks. Full-stack
rebuild of the original single-page prototype: Python/FastAPI backend (JSON-file
storage, no database) + React/Vite frontend.

See [skill.md](skill.md) for full architecture, API reference, and business-logic docs.

## Tech Stack

- **Backend**: Python 3.13, FastAPI, Pydantic v2, uvicorn, pytest
- **Frontend**: React 19, Vite, Tailwind CSS v4, lucide-react, axios

## Project Structure

```
Dinomites/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI route modules (auth, candidates, startups, ...)
│   │   ├── core/            # config, dependency injection
│   │   ├── models/          # Pydantic schemas
│   │   ├── repositories/    # JSON-file data access layer
│   │   ├── services/        # business logic (matching, PDF parsing, etc.)
│   │   ├── utils/           # seeding, factories, helpers
│   │   └── main.py          # app entrypoint
│   ├── data/                # JSON "database" files (auto-seeded)
│   ├── tests/                # pytest suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # axios client + endpoint definitions
│   │   ├── components/      # role-based UI components (admin, intern, startup, university, common)
│   │   ├── context/         # Auth/Toast React context providers
│   │   ├── hooks/           # useApi, useAuth, useToast
│   │   ├── pages/           # top-level portal pages per role
│   │   ├── styles/          # Tailwind entrypoint
│   │   └── utils/           # constants, helpers
│   └── package.json
├── skill.md                 # full architecture, API reference, business-logic docs
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate        # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Demo data seeds automatically on first boot into `backend/data/*.json`. Delete those
files to force a reseed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). The frontend expects the
backend at `http://localhost:8000` (override with a `VITE_API_URL` env var / `.env` file
in `frontend/`).

### 3. Run backend tests

```bash
cd backend
pytest -v
```

## API Documentation

Interactive Swagger UI: `http://localhost:8000/docs` (while the backend is running).
Full written reference: [skill.md](skill.md#4-api-reference).

## Default Login Roles

No password required — pick a role on the login screen:

| Role | Demo user |
|---|---|
| Intern | Aisha Al-Kuwari |
| University | Dr. Hessa Al-Naimi (UDST) |
| Startup | Omar Faisal (Nabta Health) |
| Admin | Layla Hassan (QSTP Operations) |
