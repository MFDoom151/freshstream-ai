import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteWalInitialized?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Optimize SQLite for high-concurrency read/write (WAL mode & busy timeout)
if (!globalForPrisma.sqliteWalInitialized) {
  globalForPrisma.sqliteWalInitialized = true;
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;'))
    .catch(() => {
      // Non-fatal if database is initializing or not an SQLite file
    });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
