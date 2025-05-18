############ 1. Dependencies ############
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
RUN corepack enable \
 && corepack prepare yarn@4.9.1 --activate \
 && yarn install --immutable --inline-builds

############ 2. Source + Build ##########
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/ /app/
COPY apps/web/  ./apps/web/
COPY packages/  ./packages/

# NextJS production build (static server)
RUN yarn workspace web build

############ 3. Runtime #################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/web/.next              ./.next
COPY --from=build /app/apps/web/public             ./public
COPY --from=build /app/apps/web/package.json       ./package.json
COPY --from=deps  /app/node_modules                ./node_modules

EXPOSE 3000
CMD ["node","./node_modules/next/dist/bin/next","start","-p","3000"]