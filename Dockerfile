FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN POSTGRES_DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" npm ci

FROM node:22-bookworm-slim AS production-deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations
RUN POSTGRES_DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" npm ci --omit=dev

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN POSTGRES_DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    AUTH_SECRET="build-only-not-a-deployment-secret" \
    npm run build

# Never copy developer or build-stage environment files into the runtime image.
RUN find .next/standalone -type f \( -name '.env' -o -name '.env.*' \) -delete && \
    test -z "$(find .next/standalone -type f \( -name '.env' -o -name '.env.*' \) -print -quit)"

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=node:node /app/prisma/migrations ./prisma/migrations
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/scripts/run-initial-migrations.mjs ./scripts/run-initial-migrations.mjs
COPY --from=builder --chown=node:node /app/scripts/start-container.sh ./scripts/start-container.sh
RUN chmod 0555 /app/scripts/start-container.sh
USER node
EXPOSE 3000
CMD ["/app/scripts/start-container.sh"]
