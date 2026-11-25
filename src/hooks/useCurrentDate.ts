import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function useCurrentDate(): Date {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const updateAndSchedule = () => {
      if (timer) clearTimeout(timer);
      const now = new Date();
      setCurrentDate(now);
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(updateAndSchedule, nextDay.getTime() - now.getTime());
    };
    updateAndSchedule();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateAndSchedule();
      else if (timer) clearTimeout(timer);
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return currentDate;
}

export function useCurrentDateKey(): string {
  const [todayKey, setTodayKey] = useState(() => dateKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const updateAndSchedule = () => {
      if (timer) clearTimeout(timer);
      const now = new Date();
      setTodayKey(dateKey(now));
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(updateAndSchedule, nextDay.getTime() - now.getTime());
    };
    const scheduleNextUpdate = () => {
      const now = new Date();
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(updateAndSchedule, nextDay.getTime() - now.getTime());
    };
    scheduleNextUpdate();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateAndSchedule();
      else if (timer) clearTimeout(timer);
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return todayKey;
}
