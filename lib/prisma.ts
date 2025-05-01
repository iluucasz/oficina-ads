import { PrismaClient } from '@prisma/client';

declare global {
  // Previne a reinicialização do Prisma Client durante o desenvolvimento
  // usando a variável global
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma }; 