# BananaSense AI — Frontend

React + TypeScript + Vite + Tailwind CSS demo dashboard for the BananaSense AI ripeness classifier.

## Prerequisites

- Node.js 20.19+ or 22.12+ and npm
- Backend running on port 8000 from the repo root:

```sh
# from D:\work\Banana-Sense-Ai
uvicorn backend.main:app --reload --port 8000
```

## Run in development

```sh
cd frontend
npm install --include=dev   # on machines with NODE_ENV=production, dev deps are otherwise omitted
npm run dev
```

The dev server runs on http://localhost:5173 and proxies `/upload-image` and `/analyze` to `http://localhost:8000` (see `vite.config.ts`). No CORS configuration is needed.

## Build

```sh
npm run build    # type-check (tsc -b) + production bundle in dist/
npm run preview  # serve the built bundle
```

The backend does not serve static files; the built app must be deployed separately (static host) and the proxy only applies to `npm run dev`.
