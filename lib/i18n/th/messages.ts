import type en from '../en/messages';
import type { Strings } from '../types';

/** Thai for en/messages.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  // Relative times in the list
  timeJustNow: 'เมื่อสักครู่',
  timeMinutesAgo: '{count} นาทีที่แล้ว',
  timeHoursAgo: '{count} ชม. ที่แล้ว',
  timeYesterday: 'เมื่อวาน',
  timeDaysAgo: '{count} วันที่แล้ว',

  // Declining
  declinedTitle: 'ปฏิเสธแล้ว',
  declinedBody: 'แจ้ง {name} แล้ว',
  declineFailed: 'ปฏิเสธไม่สำเร็จ ลองอีกครั้ง',
  declinePromptTitle: 'ปฏิเสธคำขอของ {name} ไหม?',
  declinePromptBody:
    'เลือกเหตุผล — ลูกค้าจะได้รับแจ้งเตือน เพื่อไปลองติดต่อ{noun}รายอื่น',
  providerFallback: 'ผู้ให้บริการ',
  declineWrongJobType: 'ประเภทงานไม่ตรง',
  declineTooFar: 'ไกลเกินไป',
  declineNotAvailable: 'ไม่ว่าง',

  // Unlocking (spends a credit)
  unlockedTitle: '✅ ปลดล็อกการติดต่อแล้ว — ใช้ 1 เครดิต',
  contactPhone: 'เบอร์โทรศัพท์: {phone}',
  contactEmail: 'อีเมล: {email}',
  notProvided: 'ไม่ได้ระบุ',
  creditsRemainingOne: 'เหลือ {count} เครดิต',
  creditsRemainingOther: 'เหลือ {count} เครดิต',
  notEnoughCreditsTitle: 'เครดิตไม่พอ',
  notEnoughCreditsBody: 'ต้องมีอย่างน้อย 1 เครดิตจึงจะปลดล็อกข้อความนี้ได้',
  notEnoughCreditsWebBody:
    'ต้องมีอย่างน้อย 1 เครดิตจึงจะปลดล็อกข้อความนี้ได้ ยอดเครดิตจัดการได้ที่ speedi.co.uk — เข้าสู่ระบบจากเว็บเบราว์เซอร์ใดก็ได้เพื่อเติมเครดิต',
  buyCredits: 'ซื้อเครดิต',
  unlockFailed: 'ปลดล็อกไม่สำเร็จ ลองอีกครั้ง',
  errorTitle: 'ข้อผิดพลาด',
  connectionFailed: 'เชื่อมต่อไม่สำเร็จ ลองอีกครั้ง',

  // Opening a conversation
  newRequestFrom: 'คำขอใหม่จาก {name}',
  newMessageFrom: 'ข้อความใหม่จาก {name}',
  newRequestBody:
    '"{message}"\n\nนี่เป็นคำขอใหม่ (ห่างจากครั้งก่อนเกิน 5 นาที) ใช้ 1 เครดิตเพื่อเปิดดู',
  newMessageBody:
    '"{message}"\n\nใช้ 1 เครดิตเพื่อปลดล็อกเบอร์โทรศัพท์และอีเมลของลูกค้า แล้วเปิดคำขอนี้',
  decline: 'ปฏิเสธ',
  openOneCredit: 'เปิด · 1 เครดิต',
  replyViaSms: '💬 ตอบกลับทาง SMS',
  call: '📞 โทร',
  email: '✉️ อีเมล',
  replyOnWeb: '🌐 ตอบกลับบนเว็บ',
  lastMessage: 'ข้อความล่าสุด:\n"{message}"',

  // The list
  quoteRequests: 'คำขอใบเสนอราคา',
  newQuotesWaitingOne: 'มีคำขอใบเสนอราคาใหม่ {count} รายการ',
  newQuotesWaitingOther: 'มีคำขอใบเสนอราคาใหม่ {count} รายการ',
  noNewQuotes: 'ไม่มีคำขอใบเสนอราคาใหม่',
  allMessages: 'ข้อความทั้งหมด',
  totalCount: 'ทั้งหมด {count}',
  hideOlder: 'ซ่อนข้อความเก่า',
  viewFullHistory: 'ดูประวัติทั้งหมด',
  recentLabel: 'ล่าสุด — 7 วันที่ผ่านมา',
  noRecentMessages: 'ไม่มีข้อความใน 7 วันที่ผ่านมา',
  lockBadge: '🔒 1 เครดิต',
  newBadge: 'ใหม่',
  viewAllOlder: 'ดูข้อความทั้งหมด (เก่ากว่านี้ {count} รายการ)',
  olderLabel: 'ข้อความเก่า',
  hideOlderMessages: 'ซ่อนข้อความเก่า',
};

export default th;
