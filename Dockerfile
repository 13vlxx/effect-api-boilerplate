# Node 24 exécute le TypeScript directement : pas d'étape de build.
FROM node:24-slim AS deps
RUN npm install -g pnpm@12.21.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts : le script "prepare" a besoin des devDependencies.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY drizzle ./drizzle
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/docs/openapi.json').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
# Applique les migrations puis démarre. Avec plusieurs réplicas, sortir la migration dans un job dédié.
CMD ["sh", "-c", "node src/migrate.ts && node src/main.ts"]
