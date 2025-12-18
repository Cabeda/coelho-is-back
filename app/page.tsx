import { getArrivalTimes, getLatestTime } from '@/app/actions';
import Stopwatch from '@/components/Stopwatch';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const latestTimeResult = await getLatestTime();
  const historyResult = await getArrivalTimes();

  const initialLatestTime = latestTimeResult.success ? latestTimeResult.data : null;
  const initialHistory = historyResult.success ? historyResult.data : [];

  return (
    <Stopwatch 
      initialLatestTime={initialLatestTime} 
      initialHistory={initialHistory} 
    />
  );
}
