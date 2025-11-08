import type { ScheduledStream } from '../types';

// Helper to create future dates for consistency
const getFutureDate = (days: number, hours: number = 0, minutes: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
};

export const SCHEDULED_STREAMS: ScheduledStream[] = [

      {
          id: '1',
          streamerUsername: 'SXB',
          startTime: getFutureDate(0, 23, 30), // 25 minutes from now
          notes: 'Just Charring, Playing MTRP in Grand Theft Auto V FiveM.',
           characters: ['Abdulsamad Alqurashi'],
      }

];
