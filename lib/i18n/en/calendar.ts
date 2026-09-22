/** English strings for this area. Keys are the contract: th/calendar.ts must have every one. */
const en = {
  // Week strip, Monday first.
  dayLetterMon: 'M',
  dayLetterTue: 'T',
  dayLetterWed: 'W',
  dayLetterThu: 'T',
  dayLetterFri: 'F',
  dayLetterSat: 'S',
  dayLetterSun: 'S',
  connectGoogle: 'Connect Google Calendar',
  connectSubtitle:
    "Sync your availability automatically. Speedi will auto-go red when you're on a job and back to green when you're free.",
  livePill: '✓ Live',
  syncing: 'Syncing availability automatically',
  todayLabel: 'TODAY — {date}',
  noEventsToday: 'No events scheduled today',
  allDay: 'All day',
  eventPill: '📅 Event',
  until: 'Until {time}',
} as const;

export default en;
