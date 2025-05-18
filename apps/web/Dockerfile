# ---------- 1. BUILD ----------
    FROM node:20-alpine AS build
    RUN apk add --no-cache libc6-compat
    WORKDIR /workspace
    
    COPY package.json yarn.lock .yarnrc.yml ./
    COPY .yarn ./.yarn
    RUN corepack enable && corepack prepare yarn@stable --activate
    RUN yarn workspaces focus web --production=false --all
    
    COPY . .
    RUN yarn workspace web build      # Next.js → .next
    
    # ---------- 2. RUN ----------
    FROM node:20-alpine AS runtime
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY --from=build /workspace/apps/web/.next ./apps/web/.next
    COPY --from=build /workspace/node_modules   ./node_modules
    COPY --from=build /workspace/apps/web/package.json ./apps/web/package.json
    
    ENV PORT=3000
    EXPOSE 3000
    CMD ["node",".next/standalone/server.js"]
    