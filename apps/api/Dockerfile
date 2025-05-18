# Builder stage: Installer root-dependencies & pruner monorepo for 'api'
FROM node:20-alpine AS builder
RUN apk update && apk add --no-cache git libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
COPY .yarnrc.yml .yarnrc.yml
COPY .yarn ./.yarn
RUN corepack enable \
 && corepack prepare yarn@4.9.1 --activate
RUN yarn install --immutable --immutable-cache --check-cache
COPY . .
RUN yarn turbo prune --scope=api --docker

# Installer stage: Installer kun dependencies for den prunede 'api' app
FROM node:20-alpine AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=builder /app/.yarnrc.yml .yarnrc.yml
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/out/json/ ./
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/out/full/ ./
RUN yarn install --immutable --immutable-cache --check-cache
RUN yarn workspace api prisma generate

# Sourcer stage: Byg 'api' appen og dens afhængigheder
FROM node:20-alpine AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
RUN yarn turbo run build --scope=api --include-dependencies --no-deps

# Runner stage: Letvægts-runtime-image til kørsel af API
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=sourcer /app/apps/api/dist ./apps/api/dist
COPY --from=sourcer /app/apps/api/package.json ./apps/api/package.json
COPY --from=sourcer /app/node_modules ./node_modules
CMD [ "node", "apps/api/dist/main.js" ]