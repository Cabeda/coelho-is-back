import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface ArrivalTime {
  id: number;
  timestamp: number;
  formatted_time: string;
  created_at: number;
}

export async function saveArrivalTime(timestamp: number, formattedTime: string): Promise<ArrivalTime> {
  const result = await prisma.arrivalTime.create({
    data: {
      timestamp: BigInt(timestamp),
      formattedTime: formattedTime,
    },
  });
  
  return {
    id: result.id,
    timestamp: Number(result.timestamp),
    formatted_time: result.formattedTime,
    created_at: Math.floor(result.createdAt.getTime() / 1000),
  };
}

export async function getAllArrivalTimes(): Promise<ArrivalTime[]> {
  const times = await prisma.arrivalTime.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
  
  return times.map(t => ({
    id: t.id,
    timestamp: Number(t.timestamp),
    formatted_time: t.formattedTime,
    created_at: Math.floor(t.createdAt.getTime() / 1000),
  }));
}

export async function getLatestArrivalTime(): Promise<ArrivalTime | null> {
  const t = await prisma.arrivalTime.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  if (!t) return null;
  
  return {
    id: t.id,
    timestamp: Number(t.timestamp),
    formatted_time: t.formattedTime,
    created_at: Math.floor(t.createdAt.getTime() / 1000),
  };
}

export default prisma;
