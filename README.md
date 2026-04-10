# Belo Backend Challenge

Aplicación backend desarrollada con [NestJS](https://nestjs.com/), TypeORM y PostgreSQL. Este proyecto implementa una solución para la gestión de cuentas y transacciones.

## 🚀 Tecnologías

- **Framework**: NestJS (Node.js)
- **Base de Datos**: PostgreSQL
- **Caché y Locks**: Redis & Redlock
- **ORM**: TypeORM
- **Documentación**: Swagger / OpenAPI
- **Testing**: Jest (Unitarios y E2E)
- **Contenedores**: Docker & Docker Compose
- **Gestor de paquetes**: pnpm

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/es/) (v22+)
- [pnpm](https://pnpm.io/es/) (Recomendado, o alternativamente npm/yarn)
- [Docker y Docker Compose](https://www.docker.com/) (Para levantar la base de datos y/o la aplicación entera)

## ⚙️ Configuración inicial

1. Clonar el repositorio.
2. Crear un archivo `.env` en la raíz del proyecto. El proyecto ya incluye un archivo `.env` por defecto que puedes utilizar como base:
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=belo-dev
DB_SYNCHRONIZE=true
TRANSACTION_PENDING_THRESHOLD=5000

REDIS_HOST=redis
REDIS_PORT=6379
```
3. Instalar las dependencias locales:
```bash
pnpm install
```

## 🏃 Ejecución del proyecto

### Usando Docker Compose (Recomendado)

Puedes levantar tanto la base de datos como la aplicación en contenedores configurados de forma automática:
```bash
docker-compose up --build
```
La aplicación se ejecutará en el puerto `4000` y la base de datos PostgreSQL se inicializará automáticamente con datos de prueba utilizando el archivo `seed.sql`.

### Ejecución Local (Desarrollo)

Si prefieres correr la aplicación localmente mediante Node y usar Docker solo para la base de datos:

1. Levantar solo la base de datos:
```bash
docker-compose up -d postgres
```
2. Ejecutar la aplicación en modo desarrollo:
```bash
pnpm run start:dev
```
De manera local, la app arrancará por defecto en el puerto `3000` (al menos que configures `PORT` en tu `.env`).

## 📚 Documentación de la API

La documentación interactiva de la API (Swagger) está disponible una vez inicializada la aplicación. Puedes acceder a ella según el entorno de ejecución:
- **Docker Compose**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Ejecución Local**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## 🧪 Testing


```bash
# Ejecutar tests unitarios
pnpm run test

# Ejecutar tests de pruebas integrales (E2E)
pnpm run test:e2e

```

## 📂 Estructura del Proyecto

A continuación se describe la organización principal de los directorios:

```text
src/
 ├── common/       # Elementos comunes: decoradores, excepciones, DTOs utilitarios, interceptores y configuración de Swagger
 ├── config/       # Archivos de configuración general (ej. validaciones, swagger)
 ├── core/         # Elementos base de la aplicación como filtros globales
 ├── modules/      # Módulos de dominio de la aplicación (Feature Modules)
 │    ├── accounts/     # Lógica de gestión de cuentas bancarias/usuarios
 │    ├── auth/         # Autenticación y estrategias (JWT)
 │    ├── currency/     # Gestión de monedas y tipos de cambio
 │    ├── redis/        # Servicio estructurado de Redis y administración de lock (Redlock)
 │    ├── transactions/ # Lógica core de transferencias y control de balance
 │    └── users/        # Entidades y manejadores de usuarios
 ├── app.module.ts # Módulo principal de la aplicación
 └── main.ts       # Punto de entrada de la aplicación

test/              # Pruebas automatizadas globales
 ├── helpers/      # Funciones auxiliares para simplificar el testing
 └── transactions/ # Suites complejas de pruebas E2E (End-to-End)
```