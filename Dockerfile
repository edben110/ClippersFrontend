# ==========================
# 🏗️ Multi-stage build optimizado para Next.js
# ==========================
FROM node:18-alpine AS base

# ==========================
# 📦 Etapa de dependencias
# ==========================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1️⃣ Copiar solo archivos de dependencias primero (mejor cache)
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# 2️⃣ Instalar dependencias
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    yarn global add pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci --legacy-peer-deps; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# ==========================
# 🔨 Etapa de construcción
# ==========================
FROM base AS builder
WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules

# 3️⃣ Copiar el código fuente después
COPY . .

# Deshabilitar telemetría
ENV NEXT_TELEMETRY_DISABLED 1

# 4️⃣ Build de producción
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    yarn global add pnpm && pnpm run build; \
  else \
    npm run build; \
  fi

# ==========================
# 🚀 Etapa de producción (Runner) - Optimizada
# ==========================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Crear directorio .next con permisos correctos
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar archivos de producción optimizados (standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]