import type en from '../en/forgotPassword';
import type { Strings } from '../types';

/** Thai for en/forgotPassword.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  sendFailed: 'ส่งลิงก์รีเซ็ตรหัสผ่านไม่ได้ กรุณาลองอีกครั้ง',
  checkEmailTitle: 'ตรวจสอบอีเมลของคุณ',
  checkEmailBody:
    'หากอีเมลนี้ตรงกับบัญชีในระบบ เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้แล้ว ลิงก์ใช้ได้ภายใน 1 ชั่วโมง',
  backToSignIn: '← กลับไปหน้าเข้าสู่ระบบ',
  title: 'ลืมรหัสผ่าน?',
  subtitle: 'กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้',
  emailPlaceholder: 'อีเมล',
  sendLink: 'ส่งลิงก์รีเซ็ตรหัสผ่าน',
};

export default th;
