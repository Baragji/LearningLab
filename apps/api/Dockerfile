# ---------- 1. BUILD-STAGE ----------
    FROM node:20-alpine AS build

    # eksterne pakker (prisma cli kræver glibc)  
    RUN apk add --no-cache libc6-compat
    
    WORKDIR /workspace               # én mappe til alt
    
    # kopiér Yarn Berry filer + root manifests
    COPY package.json yarn.lock .yarnrc.yml ./
    COPY .yarn ./.yarn
    
    # aktivér Yarn 4
    RUN corepack enable && corepack prepare yarn@stable --activate
    
    # installér KUN det workspace vi skal bruge (+ dets deps)
    RUN yarn workspaces focus api
    
    # kopiér resten af koden (efter install = maksimal cache-hit)
    COPY . .
    
    # byg Nest-app’en
    RUN yarn workspace api build         # -> apps/api/dist
    RUN yarn workspace api prisma generate
    
    # ---------- 2. RUNTIME-STAGE ----------
    FROM node:20-alpine AS runtime
    WORKDIR /app
    ENV NODE_ENV=production
    
    # tag kun det der skal bruges i drift
    COPY --from=build /workspace/apps/api/dist  ./apps/api/dist
    COPY --from=build /workspace/node_modules   ./node_modules
    COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
    
    EXPOSE 5002
    CMD ["node","apps/api/dist/main.js"]
    