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
COPY services/websocket/package.json ./services/websocket/package.json

RUN node .xernerx/cli/prepare-docker-service.mjs services/websocket

RUN --mount=type=cache,id=pnpm-suite,target=/pnpm/store \
	pnpm install --prod --no-frozen-lockfile --store-dir=/pnpm/store

COPY packages/lib/core.ts ./packages/lib/core.ts
COPY packages/lib/src ./packages/lib/src
COPY services/websocket/tsconfig.json ./services/websocket/tsconfig.json
COPY services/websocket/src ./services/websocket/src

RUN node .xernerx/cli/prepare-package.mjs --sync-only

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/lib ./packages/lib
COPY --from=builder /app/services/websocket ./services/websocket

WORKDIR /app/services/websocket
EXPOSE 5000
CMD ["node", "--import", "tsx", "src/main.ts"]
