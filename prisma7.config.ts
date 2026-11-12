import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL = Session mode (port 5432), required for Prisma migrate
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
})
