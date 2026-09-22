import type en from '../en/jobHistory';
import type { Strings } from '../types';

/** Thai for en/jobHistory.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  title: 'ประวัติงาน',
  last30Days: '30 วันที่ผ่านมา',
  empty: 'ไม่มีงานที่เสร็จแล้วใน 30 วันที่ผ่านมา',
  customer: 'ลูกค้า',
  call: '📞 โทร',
  sms: '💬 SMS',
  email: '✉ อีเมล',
  noContactDetails: 'ไม่มีข้อมูลติดต่อของลูกค้ารายนี้',
};

export default th;
