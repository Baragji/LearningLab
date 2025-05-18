# Builder stage: Installer root-dependencies & pruner monorepo for 'web'
FROM node:20-alpine AS builder
RUN apk update && apk add --no-cache git libc6-compat

WORKDIR /app
COPY package.json yarn.lock ./
COPY .yarnrc.yml .yarnrc.yml
COPY .yarn ./.yarn

# ⚠️ Denne RUN skal stå i Dockerfile, ikke i terminalen
RUN corepack enable \
 && corepack prepare yarn@4.9.1 --activate

RUN yarn install --immutable --immutable-cache --check-cache
COPY . .
RUN yarn turbo prune --scope=web --docker

# Installer stage
FROM node:20-alpine AS installer
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=builder /app/.yarnrc.yml .yarnrc.yml
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/out/json/ ./
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/out/full/ ./
RUN yarn install --immutable --immutable-cache --check-cache

# Sourcer stage: Byg Next.js
FROM node:20-alpine AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
RUN yarn workspace web next build

# Runner stage: Kør Next.js i production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=sourcer /app/apps/web/.next ./.next
COPY --from=sourcer /app/apps/web/public ./public
COPY --from=sourcer /app/apps/web/package.json ./package.json
COPY --from=sourcer /app/node_modules ./node_modules
EXPOSE 3000
CMD [ "yarn", "workspace", "web", "next", "start" ]