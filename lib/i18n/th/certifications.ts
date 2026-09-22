import type en from '../en/certifications';
import type { Strings } from '../types';

/** Thai for en/certifications.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  ciphe: 'สมาชิก CIPHE',
  publicLiability: 'ประกันภัยความรับผิดต่อบุคคลภายนอก',
  employersLiability: 'ประกันภัยความรับผิดของนายจ้าง',
  partP: 'Part P (ความปลอดภัยทางไฟฟ้า)',
  cscsCard: 'บัตร CSCS',
  fmb: 'สมาชิก FMB (Federation of Master Builders)',
  workingAtHeight: 'การอบรมการทำงานบนที่สูง',
  pda: 'สมาชิก Painting & Decorating Association',
  cityGuildsDecorating: 'City & Guilds ด้านงานทาสีและตกแต่ง',
  motTester: 'ใบอนุญาตผู้ตรวจสภาพรถ MOT',
  imi: 'สมาชิก IMI (Institute of the Motor Industry)',
  cityGuildsMotor: 'คุณวุฒิ City & Guilds ด้านยานยนต์',
  checkatrade: 'การยืนยันตัวตนกับ Checkatrade',
  other: 'คุณวุฒิหรือประกันภัยอื่นๆ',
  // Descriptions
  gasSafeRequired: 'จำเป็นสำหรับงานแก๊สทุกประเภท',
  dvsaAccreditation: 'การรับรองจาก DVSA',
};

export default th;
