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
COPY services/bot/package.json ./services/bot/package.json

RUN node .xernerx/cli/prepare-docker-service.mjs services/bot

RUN --mount=type=cache,id=pnpm-suite,target=/pnpm/store \
	pnpm install --prod --no-frozen-lockfile --store-dir=/pnpm/store

COPY packages/lib/core.ts ./packages/lib/core.ts
COPY packages/lib/src ./packages/lib/src
COPY packages/public/servers ./packages/public/servers
COPY packages/public/members ./packages/public/members
COPY services/bot/tsconfig.json ./services/bot/tsconfig.json
COPY services/bot/src ./services/bot/src

RUN node .xernerx/cli/prepare-package.mjs --sync-only

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/lib ./packages/lib
COPY --from=builder /app/packages/public ./packages/public
COPY --from=builder /app/services/bot ./services/bot

WORKDIR /app/services/bot
CMD ["node", "--import", "tsx", "src/main.ts"]
