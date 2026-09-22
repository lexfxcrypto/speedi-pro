import type en from '../en/onboarding';
import type { Strings } from '../types';

/** Thai for en/onboarding.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  // welcome.tsx
  welcomeTitle: 'ยินดีต้อนรับสู่ Speedi',
  welcomeSubtext: 'มาตั้งค่าโปรไฟล์ของคุณกัน — ใช้เวลาประมาณ 2 นาที',
  welcomeStart: 'เริ่มเลย',

  // notifications.tsx
  notifTitle: 'ไม่พลาดทุกงาน',
  notifSubtext:
    'Speedi ได้ผลเพราะมืออาชีพตอบกลับเร็ว การแจ้งเตือนช่วยให้เราติดต่อคุณได้ทันทีที่ลูกค้าต้องการ',
  notifLiveJobsTitle: 'งานใกล้คุณตอนนี้',
  notifLiveJobsBody: 'ลูกค้าในพื้นที่ของคุณกำลังต้องการความช่วยเหลือ — ตอบกลับเป็นคนแรก',
  notifAcceptedTitle: 'เมื่อลูกค้าตอบรับคุณ',
  notifAcceptedBody: 'แจ้งเตือนทันทีที่ลูกค้ายอมรับใบเสนอราคาของคุณ เพื่อให้เริ่มงานได้เลย',
  notifRemindersTitle: 'แจ้งเตือนเอกสารใกล้หมดอายุ',
  notifRemindersBody: 'เตือนล่วงหน้าก่อนเอกสารรับรองหมดอายุ — ไม่เสียป้ายรับรองของคุณ',
  notifTurnOn: 'เปิดการแจ้งเตือน',
  notifLater: 'ไว้ทีหลัง',

  // wizard.tsx — step 1
  joiningAs: 'ฉันสมัครในฐานะ…',
  soleTrader: 'ทำงานอิสระ',
  soleTraderSubtext: 'ประกอบอาชีพอิสระ ทำคนเดียว',
  companyOwner: 'เจ้าของบริษัท',
  companyOwnerSubtext: 'มีลูกจ้าง',

  // step 2
  whatAreYou: 'คุณทำงานประเภทไหน?',
  providerTrade: 'งานช่าง',
  providerTradeSubtext: 'ช่างประปา ช่างไฟ ช่างก่อสร้าง…',
  providerConcierge: 'ช่างอเนกประสงค์',
  providerConciergeSubtext: 'ช่างทั่วไปในพื้นที่ — รับได้หลายงาน',
  providerService: 'บริการ',
  providerServiceSubtext: 'ความงาม ฟิตเนส ติวเตอร์…',
  providerSports: 'กีฬา',
  providerSportsSubtext: 'สนาม โค้ช การจอง…',
  providerMerchant: 'ร้านค้าวัสดุ',
  providerMerchantSubtext: 'มีหน้าร้าน — ร้านอุปกรณ์ประปา ร้านค้าส่ง ร้านวัสดุ',

  // step 3
  howDoYouWork: 'คุณทำงานแบบไหน?',
  premisesMobile: 'ออกไปหาลูกค้า',
  premisesMobileSubtext: 'ฉันเดินทางไปหาลูกค้า',
  premisesFixed: 'มีหน้าร้าน',
  premisesFixedSubtext: 'ลูกค้ามาหาฉัน',
  premisesBoth: 'ทั้งสองแบบ',
  premisesBothSubtext: 'ผสมทั้งสองแบบ',

  // step 4
  whatsYourCategory: 'ประเภทบริการของคุณคืออะไร?',
  otherCategory: 'อื่นๆ',
  describeCategory: 'อธิบายประเภทบริการของคุณ',

  // step 5 — merchant
  merchantHeading: 'บอกเราเกี่ยวกับธุรกิจของคุณ',
  merchantIntro:
    'ร้านค้าจะแสดงบนแผนที่ของลูกค้า พร้อมที่อยู่ เบอร์โทรศัพท์ เวลาทำการ และรายละเอียดที่ทุกคนเห็นได้ — ลูกค้าไม่ต้องส่งข้อความมาถามก่อน',
  merchantBuildingLabel: 'อาคาร / ห้อง / เลขที่ (ไม่บังคับ)',
  merchantBuildingPlaceholder: 'เช่น 99/1 หมู่ 5',
  merchantStreetLabel: 'ถนน',
  merchantStreetPlaceholder: 'เช่น ถนนสุขุมวิท',
  merchantTownLabel: 'อำเภอ / เมือง',
  merchantTownPlaceholder: 'เช่น บางละมุง',
  merchantCountyLabel: 'จังหวัด (ไม่บังคับ)',
  merchantCountyPlaceholder: 'เช่น ชลบุรี',
  merchantPostcodeNote: 'รหัสไปรษณีย์จะกรอกในขั้นตอนถัดไป และใช้ปักหมุดของคุณบนแผนที่',
  merchantPhoneLabel: 'เบอร์โทรศัพท์หน้าร้าน',
  merchantPhonePlaceholder: '038 123 456',
  merchantEmailLabel: 'อีเมลธุรกิจ (ไม่บังคับ)',
  merchantEmailPlaceholder: 'orders@yourbusiness.co.th',
  merchantWebsiteLabel: 'เว็บไซต์ (ไม่บังคับ)',
  merchantWebsitePlaceholder: 'www.yourbusiness.co.th',
  merchantHoursLabel: 'เวลาทำการ',
  merchantHoursPlaceholder: 'จ.–ศ. 7:30–17:00, ส. 8:00–12:00',
  merchantDescriptionLabel: 'รายละเอียด',
  merchantDescriptionPlaceholder:
    'ร้านวัสดุประปาและเครื่องทำน้ำอุ่นแบบครอบครัว ส่งภายในวันเดียวในระยะ 15 ไมล์ มีเคาน์เตอร์สำหรับช่างที่ร้าน',
  merchantStockIntro:
    'ร้านของคุณมีสินค้าอะไรบ้าง? ลูกค้าที่กรองตามประเภทบริการจะเห็นร้านคุณในทุกหมวดที่คุณเลือก',
  categoriesStockedOne: 'มีสินค้า {count} หมวด',
  categoriesStockedOther: 'มีสินค้า {count} หมวด',

  // step 5 — everyone else
  whichTrades: 'คุณรับงานช่างประเภทไหนได้บ้าง?',
  whatDoYouOffer: 'คุณให้บริการอะไรบ้าง?',
  describeOffer: 'อธิบายบริการของคุณสั้นๆ หนึ่งหรือสองประโยค',
  conciergeIntro:
    'เลือกทุกอย่างที่คุณช่วยได้ — ลูกค้าจะเห็นคุณในทุกตัวกรองที่คุณเลือก และคุณจะได้รับแจ้งเตือนคำขอในรายการรอของทุกประเภทนั้น',
  selectAll: 'เลือกได้มากกว่าหนึ่งข้อ',
  tradesSelectedOne: 'เลือกแล้ว {count} งาน',
  tradesSelectedOther: 'เลือกแล้ว {count} งาน',
  searchServices: 'ค้นหาบริการ',
  nothingMatches: 'ไม่พบรายการที่ตรงกับ “{query}”',

  // step 6
  yourProfile: 'โปรไฟล์ของคุณ',
  yourName: 'ชื่อของคุณ',
  yourNamePlaceholder: 'เช่น สมชาย ใจดี',
  businessNameLabel: 'ชื่อธุรกิจหรือชื่อร้าน (ไม่บังคับ)',
  businessNamePlaceholder: 'เช่น สมชายการช่าง',
  yearsInBusiness: 'ทำธุรกิจมากี่ปี',
  yearsUnder1: 'น้อยกว่า 1 ปี',
  years1to3: '1-3 ปี',
  years3to10: '3-10 ปี',
  years10plus: '10 ปีขึ้นไป',
  locationWhyTitle: 'ทำไมเราต้องใช้ตำแหน่งของคุณ',
  locationWhyBody:
    'ตำแหน่งของคุณช่วยให้ลูกค้าหาคุณเจอเมื่อคุณว่าง เราจะตรวจตำแหน่งเฉพาะตอนที่คุณแสดงสถานะว่างรับงานเท่านั้น',
  locationAllowed: 'อนุญาตตำแหน่งแล้ว ✓',
  allowLocation: 'อนุญาตตำแหน่ง',
  locationDeniedNote: 'คุณเปิดใช้งานภายหลังได้ในการตั้งค่าของ iPhone',
  postcodeLabel: 'รหัสไปรษณีย์หรือพื้นที่',
  postcodePlaceholder: 'เช่น พัทยา',
  postcodeHint: 'รหัสไปรษณีย์ หรือชื่อเมืองหรืออำเภอที่คุณทำงาน',
  serviceRadius: 'รัศมีให้บริการ: {radius} ไมล์',
  radiusOption: '{radius} ไมล์',
  profilePhotoLabel: 'รูปโปรไฟล์ (ไม่บังคับ)',
  photoPermissionTitle: 'ต้องขออนุญาต',
  photoPermissionBody: 'กรุณาอนุญาตให้เข้าถึงรูปภาพเพื่ออัปโหลดรูปโปรไฟล์',
  uploadFailedTitle: 'อัปโหลดไม่สำเร็จ',
  uploadFailedStatus: 'อัปโหลดไม่สำเร็จ: {status}',
  pleaseTryAgain: 'กรุณาลองอีกครั้ง',

  // step 7
  youreReady: 'พร้อมแล้ว',
  readyBody:
    'ตั้งค่าโปรไฟล์เรียบร้อยแล้ว ลูกค้าจะเห็นคุณบนแผนที่ทันทีที่คุณเปิดสถานะว่าง คุณออนไลน์หรือออฟไลน์ได้ทุกเมื่อจากแดชบอร์ด',
  goLiveNow: 'เปิดสถานะว่างตอนนี้เลยไหม?',
  goLiveOnNote: 'คุณจะแสดงบนแผนที่ 1 ชั่วโมง แล้วจะออฟไลน์อัตโนมัติ',
  goLiveOffNote: 'ออฟไลน์ไว้ก่อน — เปิดสถานะว่างจากแดชบอร์ดเมื่อพร้อม',
  completeSetup: 'ตั้งค่าให้เสร็จ',
  setupFailed: 'ตั้งค่าไม่สำเร็จ',
};

export default th;
