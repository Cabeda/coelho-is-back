import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'stopwatch.db');
console.log('Initializing Prisma with better-sqlite3 at:', dbPath);

const adapter = new PrismaBetterSqlite3({ url: dbPath });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // In production, we still want to reuse the client if possible
  // though Next.js standalone usually handles this via module caching
  globalForPrisma.prisma = prisma;
}

export interface ArrivalTime {
  id: number;
  timestamp: number;
  type: 'ARRIVAL' | 'DEPARTURE';
  formatted_time: string;
  created_at: number;
}

export async function saveArrivalTime(timestamp: number, formattedTime: string, type: 'ARRIVAL' | 'DEPARTURE' = 'ARRIVAL'): Promise<ArrivalTime> {
  const result = await prisma.arrivalTime.create({
    data: {
      timestamp: BigInt(timestamp),
      formattedTime: formattedTime,
      type: type,
    },
  });
  
  const record = result as any;
  return {
    id: record.id,
    timestamp: Number(record.timestamp),
    type: record.type as 'ARRIVAL' | 'DEPARTURE',
    formatted_time: record.formattedTime,
    created_at: Math.floor(record.createdAt.getTime() / 1000),
  };
}

export async function getAllArrivalTimes(): Promise<ArrivalTime[]> {
  const times = await prisma.arrivalTime.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
  
  return times.map((t: any) => ({
    id: t.id,
    timestamp: Number(t.timestamp),
    type: t.type as 'ARRIVAL' | 'DEPARTURE',
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
  
  const record = t as any;
  return {
    id: record.id,
    timestamp: Number(record.timestamp),
    type: record.type as 'ARRIVAL' | 'DEPARTURE',
    formatted_time: record.formattedTime,
    created_at: Math.floor(record.createdAt.getTime() / 1000),
  };
}

export default prisma;
