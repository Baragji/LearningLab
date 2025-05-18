# --- Build stage ---
    FROM node:20-alpine AS build
    WORKDIR /usr/src/app
    
    # Kopiér kun det nødvendige for at installere afhængigheder
    COPY package.json yarn.lock ./
    COPY .yarn .yarn
    COPY .yarnrc.yml ./
    
    # Installer – kun prod-deps
    RUN corepack enable && corepack prepare yarn@stable --activate \
     && yarn workspaces focus --production --all
    
    # Kopiér resten af kildeteksten til api-workspacet og byg
    COPY apps/api ./apps/api
    WORKDIR /usr/src/app/apps/api
    RUN yarn build   # kører "nest build" hvis du har det script
    
    # --- Runtime stage ---
    FROM node:20-alpine
    WORKDIR /app
    
    ENV NODE_ENV=production \
        PORT=5002
    
    # Kopiér færdigt build + prod-node_modules
    COPY --from=build /usr/src/app/apps/api/dist ./dist
    COPY --from=build /usr/src/app/node_modules ./node_modules
    COPY --from=build /usr/src/app/apps/api/package.json ./
    
    EXPOSE $PORT
    CMD ["node", "dist/main.js"]
    