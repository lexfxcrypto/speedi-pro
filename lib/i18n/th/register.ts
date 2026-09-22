import type en from '../en/register';
import type { Strings } from '../types';

/** Thai for en/register.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  title: 'สร้างบัญชี Speedi Pro',
  namePlaceholder: 'ชื่อ',
  emailPlaceholder: 'อีเมล',
  passwordPlaceholder: 'รหัสผ่าน',
  confirmPasswordPlaceholder: 'ยืนยันรหัสผ่าน',
  passwordsDontMatch: 'รหัสผ่านไม่ตรงกัน',
  createFailed: 'สร้างบัญชีไม่สำเร็จ',
  createAccount: 'สมัครสมาชิก',
  haveAccount: 'มีบัญชีอยู่แล้ว? ',
  signIn: 'เข้าสู่ระบบ',
};

export default th;
