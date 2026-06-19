# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (devDeps needed for TypeScript compilation)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source code and TypeScript config
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript application
RUN npm run build

# Compile seed.ts to JS using TypeScript's transpileModule API
# This avoids rootDir conflicts and produces dist/seed.js for production use
RUN node -e "\
  const ts = require('typescript');\
  const fs = require('fs');\
  const src = fs.readFileSync('prisma/seed.ts', 'utf8');\
  const out = ts.transpileModule(src, {\
    compilerOptions: {\
      target: ts.ScriptTarget.ES2021,\
      module: ts.ModuleKind.CommonJS,\
      esModuleInterop: true,\
      skipLibCheck: true\
    }\
  });\
  fs.writeFileSync('dist/seed.js', out.outputText);\
  console.log('Seed compiled to dist/seed.js');\
"

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist/

# Copy entrypoint script and fix line endings (Windows CRLF -> LF)
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
