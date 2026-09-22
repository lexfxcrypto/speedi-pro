import type en from '../en/profile';
import type { Strings } from '../types';

/** Thai for en/profile.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  // Hero
  approved: '✅ อนุมัติแล้ว',
  yearsShort: '{years}+ ปี',
  radiusPill: 'รัศมี {miles} ไมล์',

  // Company card
  companyApproved: '✓ อนุมัติแล้ว',
  companyPending: 'รอการอนุมัติ',
  companyCreditsRemaining: 'เครดิตบริษัทคงเหลือ',
  companyResets: 'รีเซ็ต {date}',
  companyMode: 'โหมด: {mode}',
  modeDispatcher: 'ผู้จ่ายงาน',
  modeAutonomous: 'อิสระ',
  workersTitle: 'พนักงาน ({count})',
  invite: '+ เชิญ',
  workersEmpty: 'ยังไม่มีพนักงาน แตะ เชิญ เพื่อเพิ่มคนแรก',
  workerUnnamed: 'ไม่มีชื่อ',
  workerPendingInvite: 'รอตอบรับคำเชิญ',
  workerFallback: 'พนักงาน',
  workerInvitePending: ' · รอตอบรับคำเชิญ',
  inviteShareMessage: 'เข้าร่วม {company} บน Speedi — แตะเพื่อตอบรับ: {url}',

  // Business details
  businessDetails: 'ข้อมูลธุรกิจ',
  tradingName: 'ชื่อธุรกิจ',
  services: 'ประเภทบริการ',
  coverage: 'พื้นที่ให้บริการ',
  locationSet: 'ตั้งค่าตำแหน่งแล้ว',
  experience: 'ประสบการณ์',
  experienceYears: '{years} ปี',

  // Portfolio
  portfolioTitle: 'ผลงาน ({count}/8)',
  uploading: 'กำลังอัปโหลด…',
  addPhoto: '+ เพิ่มรูป',
  portfolioEmpty: 'ยังไม่มีรูป แตะ เพิ่มรูป เพื่อให้ลูกค้าเห็นผลงานของคุณ',
  uploadFailedTitle: 'อัปโหลดไม่สำเร็จ',
  uploadFailedStatus: 'อัปโหลดไม่สำเร็จ ({status})',
  couldNotSavePhoto: 'บันทึกรูปไม่ได้',
  permissionNeeded: 'ต้องขออนุญาต',
  permissionPhotos: 'โปรดอนุญาตให้เข้าถึงรูปภาพเพื่ออัปโหลดรูปผลงาน',
  permissionCamera: 'โปรดอนุญาตให้เข้าถึงกล้องเพื่อถ่ายรูป',
  portfolioFullTitle: 'ผลงานเต็มแล้ว',
  portfolioFullMessage: 'มีรูปได้สูงสุด 8 รูป ลบรูปเดิมออกหนึ่งรูปเพื่อเพิ่มรูปใหม่',
  addPhotoTitle: 'เพิ่มรูป',
  addPhotoMessage: 'เลือกวิธีเพิ่มรูปนี้',
  takePhoto: 'ถ่ายรูป',
  chooseFromLibrary: 'เลือกจากคลังรูปภาพ',
  removePhotoTitle: 'ลบรูปนี้?',
  removePhotoMessage: 'รูปนี้จะถูกลบออกจากผลงานของคุณ',
  remove: 'ลบ',

  // Certifications
  certsTitle: 'ใบรับรองและประกันภัย',
  add: '+ เพิ่ม',
  certsEmpty: 'ยังไม่ได้เพิ่มใบรับรอง',
  certVerified: '✓ ตรวจสอบแล้ว',
  certPending: 'รอตรวจสอบ',

  // Socials
  socialTitle: 'ลิงก์โซเชียล',
  socialEmpty: 'เพิ่มลิงก์โซเชียลของคุณ',

  // Account
  logOut: 'ออกจากระบบ',
  deleteAccount: 'ลบบัญชี',
  deleteAccountTitle: 'ลบบัญชี?',
  deleteAccountMessage:
    'บัญชี Speedi โปรไฟล์ ผลงาน และใบรับรองของคุณจะถูกลบอย่างถาวร ลูกค้าจะไม่เห็นคุณบนแผนที่อีก และไม่สามารถย้อนกลับได้',
  deleteAccountConfirm: 'ลบบัญชี',
  deleteAccountSureTitle: 'แน่ใจหรือไม่?',
  deleteAccountSureMessage: 'โอกาสสุดท้าย — เมื่อลบแล้วจะกู้คืนบัญชีไม่ได้',
  couldNotDeleteAccount: 'ลบบัญชีไม่ได้',
  deleteFailedTitle: 'ลบไม่สำเร็จ',
  deleteFailedMessage: 'ลองอีกครั้ง หรือติดต่อฝ่ายช่วยเหลือ',

  // Coverage radius sheet
  radiusTitle: 'คุณเดินทางไปได้ไกลแค่ไหน?',
  radiusNote:
    'ระยะนี้กำหนดว่างานจากรายการรอไหนจะส่งถึงคุณ รัศมีกว้างขึ้นหมายถึงงานมากขึ้น แต่ไกลขึ้น',
  radiusChip: '{miles} ไมล์',
  couldNotSave: 'บันทึกไม่ได้',
  radiusNotChanged: 'รัศมีพื้นที่ให้บริการยังไม่เปลี่ยน ลองอีกครั้ง',
  checkConnection: 'ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',
};

export default th;
