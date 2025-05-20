# 🍔 FastFood - Checkout Service

Welcome to the **Checkout microservice** for the FastFood App!  
Built with **NestJS**, **TypeScript**, **TypeORM**, and **PostgreSQL** — this service handles all payment processing operations for our fast food ordering system.

**Sonar Analyses:**

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=tech-snack-fiap-soat-tech-challenge_fastfood-checkout-service&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=tech-snack-fiap-soat-tech-challenge_fastfood-checkout-service)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=tech-snack-fiap-soat-tech-challenge_fastfood-checkout-service&metric=coverage)](https://sonarcloud.io/summary/new_code?id=tech-snack-fiap-soat-tech-challenge_fastfood-checkout-service)

## 📋 Service Overview

The Checkout Service is responsible for:

- Processing payments for customer orders via PIX QR codes
- Integrating with Mercado Pago payment gateway
- Tracking payment status and history
- Communicating payment events to other microservices
- Providing a unified payment interface for the FastFood ecosystem

This microservice follows Clean Architecture principles, with clear separation between domain logic and infrastructure concerns, ensuring maintainable and testable code.

## 🚀 Getting Started with Local Development

### Prerequisites

Before you begin, make sure you have:

- [Node.js 20+](https://nodejs.org/pt/download)
- [PostgreSQL](https://www.postgresql.org/download/) (installed locally or using Docker)
- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (optional, but helpful!)

### Setup Environment Variables

Duplicate and rename the `.env.example` to `.env`. Then update it with your local configuration values.

### Install Dependencies

From the project root, run:

```bash
npm install
```

### Set Up the Database

If you're using a local Postgres instance:

```bash
npx db-migrate db:create [YOUR_DB_NAME_FROM_ENV_FILE] -e db
```

### Run Migrations

Apply schema changes with:

```bash
npx db-migrate up
```

### Start the App in Dev Mode

```bash
npm run start:dev
```

---

## 🐳 Running with Docker

Prefer containers? Run the app using Docker:

```bash
docker compose up --build
```

> The database and migrations will be taken care of automatically! 🙌

---

## 📚 API Docs with Swagger

API documentation is auto-generated using **Swagger** and available once the app is running.

👉 Visit: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 🧪 Running Tests

To run tests in watch mode during development:

```bash
npm run test:dev
```

---

## 📝 Notes

- Migrations are managed using `db-migrate` and stored as SQL files
- The app uses path aliases and a clean architecture
- Health check endpoints are included and integrated in Docker setup

---

Made with ❤️ by TechSnack — The FastFood App
