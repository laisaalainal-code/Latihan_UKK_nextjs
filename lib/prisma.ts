import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/src/generated/prisma/client"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL belum diatur.")
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaAdapter?: PrismaMariaDb
}

function createPrismaClient() {
  const url = new URL(databaseUrl!)
  const adapter =
    globalForPrisma.prismaAdapter ??
    new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      connectionLimit: 10,
    })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaAdapter = adapter
  }

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}