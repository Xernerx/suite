# syntax=docker/dockerfile:1

FROM node:24-slim AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
ENV SUITE_MONOREPO_BUILD=1

COPY package.json ./
RUN PNPM_VER=$(node -p "require('./package.json').packageManager?.split('@')[1] || '12'") \
	&& npm install -g "pnpm@${PNPM_VER}"

COPY pnpm-workspace.yaml ./
COPY .xernerx/cli/prepare-docker-service.mjs .xernerx/cli/prepare-package.mjs ./.xernerx/cli/
COPY packages/lib/package.json ./packages/lib/package.json
COPY services/app/package.json ./services/app/package.json

RUN node .xernerx/cli/prepare-docker-service.mjs services/app

RUN --mount=type=cache,id=pnpm-suite,target=/pnpm/store \
	pnpm install --prod --no-frozen-lockfile --store-dir=/pnpm/store

COPY packages/lib/core.ts ./packages/lib/core.ts
COPY packages/lib/src ./packages/lib/src
COPY services/app/tsconfig.json ./services/app/tsconfig.json
COPY services/app/src ./services/app/src

RUN node .xernerx/cli/prepare-package.mjs --sync-only

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/lib ./packages/lib
COPY --from=builder /app/services/app ./services/app

WORKDIR /app/services/app
CMD ["node", "--import", "tsx", "src/main.ts"]
