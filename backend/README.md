# Backend (FastAPI) – Microsoft Graph

This backend will handle Microsoft Graph OAuth and sendMail securely using server-side secrets.

## Env configuration

Create `backend/.env` (do not commit) based on this example:

```
AZURE_CLIENT_ID=4bb85405-0fc5-4dcc-b758-f2bb54057a57
AZURE_TENANT_ID=consumers
AZURE_CLIENT_SECRET=REPLACE_WITH_SECRET
MAIL_FROM=beaumeteens@gmail.com
APP_URL=http://localhost:8000
```

## Install & run

```powershell
Push-Location "c:\Users\beaum\Desktop\Code\test\backend"
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
Pop-Location
```

## Routes
- `POST /send/mail` – stub for sending to one recipient via Microsoft Graph (to be completed after OAuth wiring)
- `GET /health` – simple health check

## Notes
- Never store secrets in the front-end; this service will own secret storage and token management.
- We’ll add OAuth auth code flow and token caching shortly.
