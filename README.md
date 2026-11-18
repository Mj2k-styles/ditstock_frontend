# DitStock — frontend

Interface web de **DitStock**, application de gestion de stock pour les petits commerçants et PME sénégalais :
tableau de bord, catalogue de produits, fournisseurs, entrepôts (Dakar, Thiès…), entrées et sorties de stock,
alertes de seuil, rapports et journal d'audit. Interface en français, montants en FCFA.

Ce dépôt fait partie d'une architecture **multi-repositories** :

| Dépôt | Rôle |
|---|---|
| [ditstock_backend](https://github.com/Mj2k-styles/ditstock_backend) | API Flask — CI : tests, image Docker publiée sur Docker Hub |
| **ditstock_frontend** (ce dépôt) | Interface React — CI : tests, image Docker publiée sur Docker Hub |
| dépôt de déploiement | Manifests Kubernetes — CD : déploie les images publiées |

## Technologies

React 18, Vite, React Router, Axios, Tailwind CSS, Recharts ; tests Vitest + Testing Library,
tests de bout en bout Playwright ; servi en production par **Nginx**.

## Écrans

| Page | Contenu |
|---|---|
| Connexion, mot de passe oublié, Mon compte | Authentification JWT, réinitialisation par e-mail, changement du mot de passe |
| Tableau de bord | Indicateurs, mouvements sur 30 jours, top 10 des sorties |
| Produits | Recherche, filtres (catégorie, fournisseur, entrepôt, état du stock), pagination, fiche complète, import CSV |
| Mouvements | Entrées (fournisseur, bon), sorties, transferts entre entrepôts, ajustements avec motif ; historique |
| Alertes | Produits sous le seuil minimal |
| Catégories, Fournisseurs, Entrepôts | Référentiels ; historique des approvisionnements par fournisseur |
| Rapports | Exports CSV et PDF |
| Utilisateurs, Journal d'audit | Administration (administrateur uniquement) |

Le menu et les routes s'adaptent au rôle (magasinier, gestionnaire, administrateur).

## Lancer en local

Il faut l'API (dépôt `ditstock_backend` : `docker compose up` y lance l'API et sa base sur le port 5000).

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173, /api est relayé vers http://127.0.0.1:5000
```

## Tests

```bash
npm run lint             # ESLint
npm test                 # tests unitaires Vitest
npm run test:coverage    # avec couverture
npm run build            # build de production
npm run test:e2e         # Playwright, contre une application complète (E2E_BASE_URL, défaut http://localhost:8080)
```

## Image Docker

Image multi-étapes : `node:20-alpine` compile l'application, `nginx:alpine` la sert sur le port 80.
Nginx relaie `/api/` vers l'API (le navigateur ne parle qu'à une seule origine : pas de CORS)
et `/grafana/` vers Grafana. Ces adresses sont injectées au démarrage du conteneur :

| Variable | Défaut | Rôle |
|---|---|---|
| `BACKEND_URL` | `http://backend:5000` | Service de l'API (nom du service Docker Compose ou Kubernetes) |
| `GRAFANA_URL` | `http://grafana:3000` | Grafana (facultatif ; nom complet du service dans Kubernetes) |

```bash
docker build -t ditstock-frontend .
docker run -p 8080:80 -e BACKEND_URL=http://mon-api:5000 ditstock-frontend
```

## CI (GitHub Actions)

Le pipeline [`.github/workflows/ci.yml`](.github/workflows/ci.yml) s'exécute à chaque push et pull request :

1. **checkout** du code ;
2. **installation** des dépendances (`npm ci`) ;
3. **lint** ESLint, **tests unitaires** Vitest avec couverture (rapport en artefact), **build** Vite ;
   recherche de secrets **Gitleaks** en parallèle ;
4. **build de l'image Docker**, test de démarrage du conteneur, scan **Trivy** ;
5. **push sur Docker Hub** (branche `main` et tags `v*`) avec les tags `sha-<commit>`, `latest` et `X.Y.Z` ;
6. **déclenchement du dépôt de déploiement** (`repository_dispatch`, événement `image-publiee`) avec le tag publié.

Pourquoi **GitHub Actions** : le code est déjà sur GitHub, l'outil est intégré (aucun serveur Jenkins à
maintenir), gratuit pour ce volume, et les dépôts se déclenchent entre eux nativement (`repository_dispatch`).

Configuration (Settings → Secrets and variables → Actions) :

| Type | Nom | Valeur |
|---|---|---|
| Variable | `DOCKERHUB_USERNAME` | compte Docker Hub |
| Secret | `DOCKERHUB_TOKEN` | jeton d'accès Docker Hub (Read & Write) |
| Variable | `DEPLOYMENT_REPO` | `Mj2k-styles/<dépôt de déploiement>` |
| Secret | `DEPLOYMENT_TOKEN` | jeton GitHub (fine-grained) avec *Actions : write* sur le dépôt de déploiement |

Tant que Docker Hub n'est pas configuré, l'image est construite, testée et scannée mais pas publiée.

## Structure

```
src/api/         client HTTP (jetons, rafraîchissement) et ressources de l'API
src/auth/        contexte d'authentification, routes protégées par rôle
src/components/  composants réutilisables (tableaux, formulaires, modales)
src/layouts/     mise en page (menu, en-tête)
src/pages/       écrans
src/tests/       tests Vitest
e2e/             tests Playwright
nginx.conf       configuration Nginx (template)
```
