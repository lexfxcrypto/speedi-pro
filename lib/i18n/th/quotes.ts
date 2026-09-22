import type en from '../en/quotes';
import type { Strings } from '../types';

/** Thai for en/quotes.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  // Relative times on the cards
  timeJustNow: 'เมื่อสักครู่',
  timeMinutesAgo: '{count} นาทีที่แล้ว',
  timeHoursAgo: '{count} ชม. ที่แล้ว',
  timeYesterday: 'เมื่อวาน',
  timeDaysAgo: '{count} วันที่แล้ว',

  // Responding (spends a credit)
  customerFallback: 'ลูกค้า',
  call: '📞 โทร',
  sms: '💬 SMS',
  email: '✉️ อีเมล',
  sentTitle: '✅ ส่งใบเสนอราคาแล้ว — ใช้ 1 เครดิต',
  sentBody: 'ข้อความของคุณส่งถึงกล่องข้อความของ {name} แล้ว และจะแสดงในแท็บข้อความของคุณ',
  contactPhone: 'เบอร์โทรศัพท์: {phone}',
  contactEmail: 'อีเมล: {email}',
  notProvided: 'ไม่ได้ระบุ',
  creditsRemainingOne: 'เหลือ {count} เครดิต',
  creditsRemainingOther: 'เหลือ {count} เครดิต',
  notEnoughCreditsTitle: 'เครดิตไม่พอ',
  notEnoughCreditsBody: 'ต้องมีอย่างน้อย 1 เครดิตจึงจะส่งใบเสนอราคาได้',
  notEnoughCreditsWebBody:
    'ต้องมีอย่างน้อย 1 เครดิตจึงจะส่งใบเสนอราคาได้ ยอดเครดิตจัดการได้ที่ speedi.co.uk — เข้าสู่ระบบจากเว็บเบราว์เซอร์ใดก็ได้เพื่อเติมเครดิต',
  buyCredits: 'ซื้อเครดิต',
  closedTitle: 'ปิดรับใบเสนอราคาแล้ว',
  closedBody: 'คำขอนี้ไม่รับใบเสนอราคาเพิ่มแล้ว',
  alreadyRespondedTitle: 'ตอบไปแล้ว',
  alreadyRespondedBody: 'คุณส่งใบเสนอราคาสำหรับคำขอนี้ไปแล้ว',
  errorTitle: 'ข้อผิดพลาด',
  respondFailed: 'ส่งใบเสนอราคาไม่สำเร็จ ลองอีกครั้ง',
  connectionFailed: 'เชื่อมต่อไม่สำเร็จ ลองอีกครั้ง',
  confirmTitle: 'ตอบคำขอ {jobType} ไหม?',
  confirmBody:
    'จะใช้ 1 เครดิต คุณจะได้ข้อมูลติดต่อของ{name} และเริ่มแชทกับลูกค้า',
  theCustomer: 'ลูกค้า',
  respondButton: 'ส่งใบเสนอราคา · 1 เครดิต',

  // The screen
  title: 'คำขอใบเสนอราคา',
  empty: 'ยังไม่มีคำขอใบเสนอราคาใหม่',
  emptyHint: 'คำขอใบเสนอราคาใหม่จะแสดงที่นี่ เมื่อลูกค้าในพื้นที่ของคุณส่งคำขอเข้ามา',
  quoteRequestFallback: 'คำขอใบเสนอราคา',
  responded: '✓ ตอบแล้ว',
  closed: 'ปิดแล้ว',
};

export default th;
