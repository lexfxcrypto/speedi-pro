import type en from '../en/waiting';
import type { Strings } from '../types';

/** Thai for en/waiting.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  // Relative times on the request cards
  timeJustNow: 'สักครู่',
  timeMinutesAgo: '{count} นาทีที่แล้ว',
  timeHoursAgo: '{count} ชม. ที่แล้ว',
  timeDaysAgo: '{count} วันที่แล้ว',
  timeExpired: 'หมดเวลาแล้ว',
  timeMinutesLeft: 'เหลือ {minutes} นาที',
  timeHoursLeft: 'เหลือ {hours} ชม.',
  timeHoursMinutesLeft: 'เหลือ {hours} ชม. {minutes} นาที',
  addedAgo: 'เพิ่มเมื่อ {ago}',

  // Accepting a request
  acceptedTitle: '✅ รับงานแล้ว — ใช้ 1 เครดิต',
  acceptedBodyOne: 'ลูกค้า: {name}\nเบอร์โทรศัพท์: {phone}\n\nคุณเหลือ {count} เครดิต',
  acceptedBodyOther: 'ลูกค้า: {name}\nเบอร์โทรศัพท์: {phone}\n\nคุณเหลือ {count} เครดิต',
  unknownCustomer: 'ไม่ทราบชื่อ',
  notProvided: 'ไม่ได้ระบุ',
  later: 'ไว้ทีหลัง',
  greetingFallbackName: 'ลูกค้า',
  providerFallback: 'ผู้ให้บริการ',
  smsYourProvider: '{noun} ที่คุณติดต่อมา',
  smsAcceptedMessage:
    'สวัสดีคุณ{name} นี่คือ {sender} จาก {business} เห็นคำขอของคุณใน Speedi แล้ว และช่วยได้ ตอนนี้ว่างและพร้อมไปหาคุณเลย สะดวกเวลาไหนดี?',
  notEnoughCreditsTitle: 'เครดิตไม่พอ',
  notEnoughCreditsBody: 'ต้องมีอย่างน้อย 1 เครดิตจึงจะรับงานได้',
  notEnoughCreditsWebBody:
    'ต้องมีอย่างน้อย 1 เครดิตจึงจะรับงานได้ ยอดเครดิตจัดการได้ที่ speedi.co.uk — เข้าสู่ระบบจากเว็บเบราว์เซอร์ใดก็ได้เพื่อเติมเครดิต',
  buyCredits: 'ซื้อเครดิต',
  errorTitle: 'ข้อผิดพลาด',
  acceptFailed: 'รับงานไม่สำเร็จ ลองอีกครั้ง',
  connectionFailed: 'เชื่อมต่อไม่สำเร็จ ลองอีกครั้ง',

  // Completing a job
  jobCompleteTitle: '✅ งานเสร็จแล้ว!',
  askForReview: 'อยากขอให้คุณ{name}ช่วยรีวิวไหม?',
  reviewViaWhatsApp: '🟢 ขอรีวิวทาง WhatsApp',
  reviewViaSms: '⭐ ขอรีวิวทาง SMS',
  maybeLater: 'ไว้ทีหลัง',
  reviewRequestMessage:
    'สวัสดีคุณ{name} ขอบคุณที่ใช้ Speedi! หวังว่าจะพอใจกับงานนะ ถ้ามีเวลาสักครู่ รบกวนช่วยรีวิวสั้นๆ ให้หน่อย ใช้เวลาแค่ 30 วินาที: {url}',

  // Contact buttons (emoji added in the screen)
  call: 'โทร',
  sms: 'SMS',
  email: 'อีเมล',

  // Active jobs
  activeJobs: 'งานที่กำลังทำ',
  noActiveJobs: 'ตอนนี้ยังไม่มีงานที่กำลังทำ',
  noActiveJobsHint: 'รับงานจากคำขอด้านล่างเพื่อเริ่มต้น',
  customer: 'ลูกค้า',
  inProgress: '● กำลังดำเนินการ',
  markComplete: '✓ แจ้งว่างานเสร็จ',
  reportConnectionFooter: 'รายงานการติดต่อนี้ · ขอคืนเครดิต',
  creditRefunded: 'คืนเครดิตแล้ว ✓',
  refundDeclined: 'คำขอคืนเครดิตถูกปฏิเสธ',
  refundUnderReview: 'กำลังตรวจสอบคำขอคืนเครดิต',

  // Live requests
  liveRequests: 'คำขอใกล้คุณตอนนี้',
  noRequestsToday: 'วันนี้ยังไม่มีคำขอใหม่',
  noRequestsHint: 'เราจะแจ้งเตือนเมื่อมีงานเข้ามา',
  distanceMiles: '{miles} ไมล์',
  distanceUnknown: 'ไม่ทราบระยะทาง',
  acceptButton: 'รับงาน · 1 เครดิต',
  view: '👁 ดู',

  // Recently completed
  recentlyCompletedOne: '✓ เพิ่งเสร็จ ({count} งาน)',
  recentlyCompletedOther: '✓ เพิ่งเสร็จ ({count} งาน)',
  completedAt: 'เสร็จแล้ว · {time}',
  noContactDetails: 'ไม่มีข้อมูลติดต่อของลูกค้ารายนี้',
  viewJobHistory: 'ดูประวัติงาน',

  // Refund ("report this connection") sheet
  refundTitle: 'รายงานการติดต่อนี้',
  refundReasonNeverReplied: 'ลูกค้าไม่ตอบกลับเลย',
  refundReasonProOnPro: 'เป็นผู้ให้บริการด้วยกัน — ไม่ใช่ลูกค้าจริง',
  refundReasonSpam: 'สแปมหรือการคุกคาม',
  refundReasonFakeJob: 'งานที่แต่งขึ้น',
  refundReasonOther: 'อื่นๆ (อธิบายด้านล่าง)',
  refundNoteRequired: 'อธิบายสิ่งที่เกิดขึ้น (จำเป็น)',
  refundNoteOptional: 'มีอะไรที่เราควรรู้ไหม (ไม่บังคับ)',
  refundDescribeIssue: 'กรุณาอธิบายปัญหา',
  refundFileFailed: 'ส่งคำขอคืนเครดิตไม่สำเร็จ',
  refundNetworkError: 'เครือข่ายขัดข้อง',
  refundSubmit: 'ส่งคำขอคืนเครดิต',
  refundFooterCopy:
    'Speedi ตรวจสอบคำขอคืนเครดิตทุกรายการ หากอนุมัติจะได้เครดิตคืนภายใน 1 วัน',
};

export default th;
