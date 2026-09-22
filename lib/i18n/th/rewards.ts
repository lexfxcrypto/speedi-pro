import type en from '../en/rewards';
import type { Strings } from '../types';

/** Thai for en/rewards.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  justNow: 'เมื่อสักครู่',
  minutesAgo: '{count} นาทีที่แล้ว',
  todayAt: 'วันนี้ {time}',
  yesterday: 'เมื่อวาน',
  daysAgo: '{count} วันที่แล้ว',
  oneWeekAgo: '1 สัปดาห์ที่แล้ว',
  affiliatePill: 'เข้าร่วมโปรแกรมพันธมิตร — รับเงินคืน 15%',
  heroTitle: 'แนะนำผู้ให้บริการ',
  heroSubtitle:
    'แชร์โค้ดของคุณ เมื่อเขาสมัครสมาชิก คุณได้รับประโยชน์ทั้งคู่ — คุณจะได้ 10% ของทุกแพ็กเครดิตที่เขาซื้อ นาน 6 เดือน',
  copy: '📋 คัดลอก',
  shareLink: '📤 แชร์ลิงก์แนะนำ',
  creditsEarned: 'เครดิตที่ได้รับ',
  referrals: 'การแนะนำ',
  creditHistory: 'ประวัติเครดิต',
  historyEmpty: 'ยังไม่มีรายการเครดิต รับงานหรือซื้อแพ็กเพื่อเริ่มต้น',
  buyCredits: '💳 ซื้อเครดิต',
  needMoreCredits: 'ต้องการเครดิตเพิ่ม?',
  creditsInfoBody:
    'แพ็กเครดิตจัดการได้ที่ speedi.co.uk — เข้าสู่ระบบบัญชีของคุณจากเว็บเบราว์เซอร์ใดก็ได้เพื่อเติมเครดิต',
};

export default th;
