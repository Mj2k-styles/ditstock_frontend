# Étape 1 : compilation de React
FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Étape 2 : image légère Nginx qui sert uniquement le build statique
FROM nginx:alpine
# Template : les variables ci-dessous sont injectées au démarrage du conteneur
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Adresse de l'API et de Grafana (noms des services Docker Compose ou Kubernetes)
ENV BACKEND_URL=http://backend:5000 \
    GRAFANA_URL=http://grafana:3000 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
