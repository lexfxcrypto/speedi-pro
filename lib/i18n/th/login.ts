import type en from '../en/login';
import type { Strings } from '../types';

/** Thai for en/login.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  title: 'เข้าสู่ระบบ Speedi Pro',
  emailPlaceholder: 'อีเมล',
  passwordPlaceholder: 'รหัสผ่าน',
  forgotPassword: 'ลืมรหัสผ่าน?',
  invalidCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  signIn: 'เข้าสู่ระบบ',
  noAccount: 'ยังไม่มีบัญชี? ',
  createOne: 'สมัครสมาชิก',
};

export default th;
