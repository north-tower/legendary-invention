# Sychar CoPilot Independent Deployment Guide

Each project component now has its own `docker-compose.yml` and can be managed independently.

## 1. Backend & Database (in `sychar/`)

### Configure Environment
```bash
cp .env.example .env
# Edit .env: ensure FRONTEND_URL=http://localhost:7000
# For WhatsApp bot, also set:
# APP_BASE_URL, ANTHROPIC_API_KEY,
# TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
```

### Launch
```bash
docker compose up -d --build
```

### Initial Setup
```bash
# Run migrations
docker compose exec backend npm run migration:run

# Seed data
docker compose exec backend npm run seed
```

## 2. Frontend (in `sychar-frontend/`)

### Configure Environment
```bash
cp .env.example .env
# Edit .env: ensure NEXT_PUBLIC_API_URL=http://your-host-ip:6901/api/v1
```

### Launch
```bash
docker compose up -d --build
```

---

## Infrastructure Overview

- **Frontend**: Port `7000`
- **Backend**: Port `6901`
- **Database**: Host port `5433` (External) / `5432` (Internal)
