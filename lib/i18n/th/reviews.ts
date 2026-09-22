import type en from '../en/reviews';
import type { Strings } from '../types';

/** Thai for en/reviews.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  justNow: 'เมื่อสักครู่',
  hoursAgo: '{count} ชม. ที่แล้ว',
  yesterday: 'เมื่อวาน',
  daysAgo: '{count} วันที่แล้ว',
  weeksAgoOne: '1 สัปดาห์ที่แล้ว',
  weeksAgoOther: '{count} สัปดาห์ที่แล้ว',
  monthsAgoOne: '1 เดือนที่แล้ว',
  monthsAgoOther: '{count} เดือนที่แล้ว',
  basedOnOne: 'จาก {count} รีวิว',
  basedOnOther: 'จาก {count} รีวิว',
  noReviews: 'ยังไม่มีรีวิว',
  noReviewsSub: 'ทำงานให้เสร็จเพื่อเริ่มได้รับรีวิว',
  anonymous: 'ไม่ระบุชื่อ',
  getMoreTitle: 'รับรีวิวเพิ่ม',
  getMoreSubtitle: 'แสดงโค้ดนี้เมื่อจบงาน หรือส่งลิงก์ให้ลูกค้า',
  shareMessage: 'ขอบคุณที่ใช้บริการ! ถ้ามีเวลาสักนิด ช่วยรีวิวให้หน่อยจะช่วยได้มาก: {url}',
  sendToCustomer: 'ส่งให้ลูกค้า',
  copyLink: 'คัดลอกลิงก์',
  copiedTitle: 'คัดลอกแล้ว',
  copiedBody: 'คัดลอกลิงก์รีวิวไปยังคลิปบอร์ดแล้ว',
};

export default th;
