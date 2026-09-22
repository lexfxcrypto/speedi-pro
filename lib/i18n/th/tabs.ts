import type en from '../en/tabs';
import type { Strings } from '../types';

/** Thai for en/tabs.ts. A missing or misspelt key fails the type check. */
const th: Strings<typeof en> = {
  home: 'หน้าแรก',
  waiting: 'รายการรอ',
  messages: 'ข้อความ',
  profile: 'โปรไฟล์',
  reviews: 'รีวิว',
  rewards: 'รางวัล',
};

export default th;
