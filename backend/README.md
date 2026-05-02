# Biblioteca (power_esta)

## Backend (Spring Boot)

- Base PostgreSQL: **`power_esta`**
- Config: `src/main/resources/application.properties`

Lancer:

```bash
mvn spring-boot:run
```

URL: `http://localhost:8080`

## Frontend (React / Vite)

Dossier: `frontend/`

Installer:

```bash
cd frontend
npm install
```

Lancer:

```bash
npm run dev
```

URL: `http://localhost:5173`

Le frontend appelle le backend via:
- variable `.env` : `VITE_API_BASE_URL=http://localhost:8080`
- proxy Vite : `/api` et `/uploads` → `http://localhost:8080`

