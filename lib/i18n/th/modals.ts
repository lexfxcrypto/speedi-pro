import type en from '../en/modals';
import type { Strings } from '../types';

/** Thai for en/modals.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  // Shared by the modals
  failedToSave: 'บันทึกไม่สำเร็จ',

  // EditBusinessModal
  editBusinessTitle: 'แก้ไขโปรไฟล์',
  editBusinessTradingName: 'ชื่อธุรกิจ',
  editBusinessTradingNamePlaceholder: 'เช่น ช่างต้นประปาและไฟฟ้า',
  editBusinessServices: 'ประเภทบริการที่คุณให้ (เลือกแล้ว {count})',
  editBusinessServicesNote: 'คุณจะได้รับคำของานและคำขอใบเสนอราคาเฉพาะประเภทบริการที่เลือกไว้ที่นี่เท่านั้น',
  editBusinessAbout: 'แนะนำตัว',
  editBusinessAboutPlaceholder: 'เล่าให้ลูกค้าฟังเกี่ยวกับประสบการณ์ของคุณ...',
  editBusinessYears: 'ประสบการณ์ (ปี)',
  editBusinessYearsPlaceholder: 'เช่น 10',
  editBusinessPhone: 'เบอร์โทรศัพท์',
  editBusinessPhonePlaceholder: '08x-xxx-xxxx',
  editBusinessLineId: 'LINE ID',
  editBusinessLineIdPlaceholder: 'เช่น termaza27 หรือ @yourshop',
  editBusinessAddress: 'พื้นที่ให้บริการ / ที่อยู่ธุรกิจ',
  editBusinessAddressPlaceholder: 'เช่น พัทยากลาง — รัศมี 10 ไมล์',
  editBusinessWebsite: 'เว็บไซต์',
  editBusinessSave: 'บันทึกโปรไฟล์',

  // AddSocialModal
  addSocialTitle: 'เพิ่มลิงก์โซเชียล',
  addSocialPlatform: 'แพลตฟอร์ม',
  addSocialUrl: 'ลิงก์ (URL)',
  addSocialUrlRequired: 'กรอกลิงก์หรือชื่อผู้ใช้',

  // AddCredentialModal
  addCredentialTitle: 'เพิ่มใบรับรอง',
  addCredentialType: 'ประเภทใบรับรอง',
  addCredentialTitleLabel: 'ชื่อใบรับรอง',
  addCredentialTitlePlaceholder: 'เช่น Gas Safe Register',
  addCredentialIssuedBy: 'ออกโดย',
  addCredentialIssuedByPlaceholder: 'เช่น Gas Safe Register Ltd',
  addCredentialExpiry: 'วันหมดอายุ (ไม่บังคับ)',
  addCredentialTapToSet: 'แตะเพื่อเลือกวันที่',
  addCredentialSave: 'บันทึกใบรับรอง',
  addCredentialPickType: 'เลือกประเภทใบรับรอง',
  addCredentialTitleRequired: 'ต้องระบุชื่อใบรับรอง',
  addCredentialIssuerRequired: 'ต้องระบุผู้ออกใบรับรอง',
  addCredentialFailed: 'เพิ่มใบรับรองไม่สำเร็จ',

  // CreditsPurchaseSheet
  creditsTitle: 'ซื้อเครดิต',
  creditsIntroBadge: 'ราคาพิเศษช่วงเปิดตัว',
  creditsSubtitle:
    '1 เครดิตใช้ติดต่อลูกค้าได้ 1 ราย เมื่อคุณตอบรับงาน แพ็กใหญ่ยิ่งคุ้มต่อเครดิต',
  creditsUnavailable:
    'ยังไม่มีแพ็กเครดิตให้ซื้อในตอนนี้ ลองใหม่อีกสักครู่ หรือเติมเครดิตที่ speedi.co.uk',
  creditsLoadFailed: 'โหลดแพ็กเครดิตไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',
  creditsPackCount: '{count} เครดิต',
  creditsPerCredit: 'เครดิตละ {price}',
  creditsAddedTitle: 'เพิ่มเครดิตแล้ว 🎉',
  creditsAddedOne: 'เพิ่ม {count} เครดิตเข้าบัญชีแล้ว ตอนนี้คุณมี {balance} เครดิต',
  creditsAddedOther: 'เพิ่ม {count} เครดิตเข้าบัญชีแล้ว ตอนนี้คุณมี {balance} เครดิต',
  creditsPurchaseFailed: 'ซื้อไม่สำเร็จ',
  creditsFooter:
    'แพ็กราคาเดียวกันมีให้ซื้อที่ speedi.co.uk ด้วย — ไม่เสียค่าธรรมเนียมของ Apple เลือกทางที่สะดวกได้เลย',

  // WaitingListPanel
  waitingEmpty:
    'เมื่อลูกค้าติดตามคุณที่นี่ พวกเขาจะได้รับการแจ้งเตือนทันทีที่คุณเปิดสถานะว่าง — หรือเมื่อคุณประกาศว่ามีคิวว่างจากการยกเลิก',
  waitingLabelOne: 'คนอยากรู้ว่าคุณว่างเมื่อไร',
  waitingLabelOther: 'คนอยากรู้ว่าคุณว่างเมื่อไร',
  waitingSomeStanding:
    'ทั้ง {waiting} คนจะได้รับแจ้งเมื่อคุณเปิดสถานะว่าง และ {standing} คนในนั้นขอรับข้อความจากคุณโดยตรงด้วย',
  waitingMessageButton: 'ส่งข้อความถึง {count} คนที่ติดตามคุณ',
  waitingNoStanding:
    'ทุกคนจะได้รับแจ้งเมื่อคุณเปิดสถานะว่าง ยังไม่มีใครขอรับข้อความจากคุณโดยตรง — แชร์ลิงก์ของคุณแล้วบอกให้เลือก “ทุกครั้ง”',
  waitingSheetTitle: 'ส่งข้อความถึงรายการรอ',
  waitingSheetHint:
    'ส่งถึง {count} คนที่ขอรับข้อความจากคุณทุกครั้ง หมุดของคุณยังคงเดิม — ข้อความนี้ไม่ได้เปิดสถานะว่าง เหมาะสำหรับบอกว่ามีคิวว่าง และบอกเมื่อคิวนั้นเต็มแล้ว',
  waitingPlaceholder: 'ศุกร์นี้ 15:00 มีคิวว่าง — ใครทักมาก่อนได้ก่อน',
  waitingSend: 'ส่ง',
  waitingLimit: 'ส่งข้อความได้สูงสุดวันละ 4 ครั้ง',
  waitingNotYet: 'ยังส่งไม่ได้ตอนนี้',
  waitingCouldNotSend: 'ส่งไม่ได้',
  waitingSendFailed: 'เกิดข้อผิดพลาด ลองใหม่อีกครั้งในอีกสักครู่',
  waitingSent: 'ส่งแล้ว',
  waitingSentNobody:
    'ยังไม่มีใครขอรับแจ้งทุกครั้ง ข้อความนี้จึงไม่ได้ส่งถึงใคร ระบบจะส่งให้อัตโนมัติเมื่อมีคนเลือกรับ',
  waitingSentOne: 'แจ้ง {count} คนแล้ว',
  waitingSentOther: 'แจ้ง {count} คนแล้ว',
  waitingCheckConnection: 'ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',

  // BuildYourList
  buildListHeader: 'ชวนลูกค้าเข้ารายการของคุณ',
  buildListHint:
    'พวกเขาจะได้รับการแจ้งเตือนทันทีที่คุณเปิดสถานะว่าง หรือเมื่อคุณประกาศคิวว่างจากการยกเลิก ให้สแกนโค้ดที่หน้าร้าน หรือส่งลิงก์ให้พวกเขา',
  buildListShareMessage:
    'ปกติคิวเราเต็ม — แต่ถ้ามีคนยกเลิก เราจะประกาศบน Speedi ก่อนที่อื่น\n\nแตะที่นี่ ดาวน์โหลดแอปฟรี แล้วกด "แจ้งเตือน" (เลือก "แจ้งทุกครั้ง") คุณจะรู้ทันทีที่มีคิวว่าง:\n{link}',
  buildListSend: 'ส่งให้ลูกค้า',
  buildListCopy: 'คัดลอกลิงก์',
  buildListCopiedTitle: 'คัดลอกแล้ว',
  buildListCopiedMessage: 'วางไว้ในโปรไฟล์หรือสตอรี่ของคุณ',

  // PasswordInput
  passwordShow: 'แสดงรหัสผ่าน',
  passwordHide: 'ซ่อนรหัสผ่าน',

  // PhoneInputWithCountry
  phonePlaceholder: 'เบอร์โทรศัพท์',
  phoneCountryCode: 'รหัสประเทศ',
};

export default th;
