# Outreach Email App (Yassir)

A modern email outreach platform with campaign management, lead tracking, and Microsoft 365 integration.

## Features

- 🎨 **Three Theme System**: Light, Dark, and Cyber (with animated neon effects)
- 📧 **Email Campaigns**: Create and manage multi-stage email campaigns
- 👥 **Lead Management**: Import and track leads with CSV support
- 📅 **Scheduling**: Plan email sends with calendar view
- 🔐 **Microsoft 365 Auth**: Device code flow for secure authentication
- ⚡ **Fast Startup**: Optimized React + Vite frontend (~200ms dev server)
- 📦 **Code Splitting**: Pages load on-demand for faster initial load (60KB vs 170KB)

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite 5.4 (with lazy loading & code splitting)
- TailwindCSS (custom theme system)
- Zustand (state management)
- React Router (routing)

**Backend:**
- FastAPI (Python)
- Microsoft Graph API
- MSAL (authentication)

## Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)

### Installation & Run

```bash
# Run unified launcher (auto-installs dependencies)
python start.py
```

The app will open at http://localhost:5173

**Manual setup:**
```bash
# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd backend
pip install fastapi uvicorn httpx msal python-multipart
uvicorn app.main:app --reload --port 8000
```

## Configuration

Settings are configured in the app UI (`/settings` page):

- **Azure App Registration**:
  - Client ID
  - Tenant ID (or "consumers" for personal accounts)
  
- **Branding**:
  - Logo upload
  - From name
  - Signature

## Production Build

```bash
# Build optimized frontend
npm run build

# Serve with backend (automatically serves dist/ folder)
python start.py
```

**Optimizations:**
- Terser minification with console.log removal
- Code splitting: ~60KB initial load (down from ~170KB)
- 1-year cache headers for hashed assets
- Vendor chunk separation (react, ui, utils)

## Project Structure

```
.
├── src/
│   ├── pages/          # Route components (lazy-loaded)
│   ├── components/     # Reusable UI components
│   ├── store/          # Zustand state management
│   └── index.css       # Theme system & global styles
├── backend/
│   └── app/
│       ├── main.py     # FastAPI app & routes
│       └── .token_cache.json  # Auth tokens (gitignored)
├── start.py            # Unified launcher with timing
└── vite.config.ts      # Build optimizations
```

## Theme System

Three themes with CSS custom properties:

- **Light**: Clean professional look
- **Dark**: Easy on the eyes
- **Cyber**: Glassmorphism with animated cyan/pink neon glow

Preview themes before saving in Settings.

## License

MIT
- Replace mocks with API calls
- Implement reaction detection to skip Mail 2 when replied
- Persist data (DB)
