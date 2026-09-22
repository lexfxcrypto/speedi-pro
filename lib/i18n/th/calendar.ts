import type en from '../en/calendar';
import type { Strings } from '../types';

/** Thai for en/calendar.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  dayLetterMon: 'จ',
  dayLetterTue: 'อ',
  dayLetterWed: 'พ',
  dayLetterThu: 'พฤ',
  dayLetterFri: 'ศ',
  dayLetterSat: 'ส',
  dayLetterSun: 'อา',
  connectGoogle: 'เชื่อมต่อ Google Calendar',
  connectSubtitle:
    'ซิงค์สถานะว่างของคุณอัตโนมัติ Speedi จะเปลี่ยนเป็นแดงให้เองเมื่อคุณติดงาน และกลับเป็นเขียวเมื่อคุณว่าง',
  livePill: '✓ เชื่อมต่อแล้ว',
  syncing: 'กำลังซิงค์สถานะว่างอัตโนมัติ',
  todayLabel: 'วันนี้ — {date}',
  noEventsToday: 'วันนี้ไม่มีนัดหมาย',
  allDay: 'ทั้งวัน',
  eventPill: '📅 นัดหมาย',
  until: 'ถึง {time}',
};

export default th;
