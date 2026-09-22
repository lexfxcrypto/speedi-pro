import type en from '../en/common';
import type { Strings } from '../types';

/** Thai for en/common.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  cancel: 'ยกเลิก',
  save: 'บันทึก',
  saving: 'กำลังบันทึก…',
  done: 'เสร็จสิ้น',
  close: 'ปิด',
  back: 'ย้อนกลับ',
  next: 'ถัดไป',
  continue: 'ดำเนินการต่อ',
  retry: 'ลองอีกครั้ง',
  loading: 'กำลังโหลด…',
  error: 'เกิดข้อผิดพลาด',
  networkError: 'เชื่อมต่อ Speedi ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',
  ok: 'ตกลง',
  yes: 'ใช่',
  no: 'ไม่',
  delete: 'ลบ',
  edit: 'แก้ไข',
  language: 'ภาษา',
};

export default th;
