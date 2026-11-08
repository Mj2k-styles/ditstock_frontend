# Frontend — Gestion de stock

React 18 · Vite · React Router · Axios · Tailwind CSS · Recharts · Vitest.

## Démarrage
    cp .env.example .env
    npm install
    npm run dev          # http://localhost:5173 (/api relayé vers Flask)

## Commandes
    npm run lint         # ESLint
    npm test             # Vitest
    npm run test:coverage
    npm run build

## Docker
    docker build -t gestion-stock-frontend .
Image multi-étapes : node:20-alpine (build) puis nginx:alpine (statique).
Les appels API utilisent le chemin relatif /api, relayé vers Flask par le Nginx principal.
