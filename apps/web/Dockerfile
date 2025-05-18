# --- Build ---
    FROM node:20-alpine AS build
    WORKDIR /usr/src/app
    
    COPY package.json yarn.lock ./
    COPY .yarn .yarn
    COPY .yarnrc.yml ./
    RUN corepack enable && corepack prepare yarn@stable --activate \
     && yarn workspaces focus --all  # web har brug for dev-deps til Next build
    
    COPY apps/web ./apps/web
    WORKDIR /usr/src/app/apps/web
    RUN yarn build   # next build
    
    # --- Runtime ---
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production \
        PORT=3000
    
    COPY --from=build /usr/src/app/apps/web/.next ./.next
    COPY --from=build /usr/src/app/apps/web/public ./public
    COPY --from=build /usr/src/app/node_modules ./node_modules
    COPY --from=build /usr/src/app/apps/web/package.json ./
    
    EXPOSE $PORT
    CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
    