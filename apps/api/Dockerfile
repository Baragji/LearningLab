############ 1. Dependencies ############
FROM node:20-alpine AS deps
WORKDIR /app

# Kopiér Yarn Berry‑metadata først for cache‑hit
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/

RUN corepack enable \
 && corepack prepare yarn@4.9.1 --activate \
 && yarn install --immutable --inline-builds

############ 2. Source + Build ##########
FROM node:20-alpine AS build
WORKDIR /app

# Hent allerede installerede node_modules
COPY --from=deps /app/ /app/

# Kopiér kun det der vedrører API‑appen (+ shared packages)
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Byg NestJS
RUN yarn workspace api build

############ 3. Runtime #################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Hent compiled output & prod‑deps
COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps  /app/node_modules ./node_modules

EXPOSE 5002
CMD ["node","dist/main.js"]