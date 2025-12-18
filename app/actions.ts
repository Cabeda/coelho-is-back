'use server';

import { saveArrivalTime, getAllArrivalTimes, getLatestArrivalTime } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function recordArrivalTime(timestamp: number, formattedTime: string, type: 'ARRIVAL' | 'DEPARTURE' = 'ARRIVAL') {
  try {
    console.log(`Recording ${type}:`, { timestamp, formattedTime });
    const result = await saveArrivalTime(timestamp, formattedTime, type);
    console.log(`Successfully saved ${type}:`, result);
    revalidatePath('/');
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error recording ${type}:`, error);
    return { success: false, error: error instanceof Error ? error.message : `Failed to record ${type}` };
  }
}

export async function getArrivalTimes() {
  try {
    const times = await getAllArrivalTimes();
    return { success: true, data: times };
  } catch (error) {
    console.error('Error fetching arrival times:', error);
    return { success: false, error: 'Failed to fetch arrival times', data: [] };
  }
}

export async function getLatestTime() {
  try {
    const time = await getLatestArrivalTime();
    return { success: true, data: time };
  } catch (error) {
    console.error('Error fetching latest time:', error);
    return { success: false, error: 'Failed to fetch latest time', data: null };
  }
}
