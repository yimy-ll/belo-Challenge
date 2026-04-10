# Etapa de construcción
FROM node:22-alpine AS builder

# Variables de entorno por defecto
ENV NODE_ENV=development

# Establecer directorio de trabajo
WORKDIR /app

# Instalar pnpm (ya que el proyecto usa pnpm-lock.yaml)
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias
RUN pnpm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN pnpm run build

#------------------------------------------------------------

# Etapa de producción
FROM node:22-alpine AS production

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos construidos y de dependencias desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE ${PORT}

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]