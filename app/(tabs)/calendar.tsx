import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SlotTone = 'green' | 'red' | 'amber' | 'speedi';

type Slot = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  tone: SlotTone;
};

const SLOTS: Slot[] = [
  {
    id: 's1',
    time: '9:00 AM',
    title: 'Free slot',
    subtitle: 'Auto-green · 3 customers waiting',
    tone: 'green',
  },
  {
    id: 's2',
    time: '12:00 PM',
    title: 'Boiler Service',
    subtitle: 'Mrs Thompson · PR2 6AX',
    tone: 'red',
  },
  {
    id: 's3',
    time: '2:00 PM',
    title: 'Finishing up',
    subtitle: 'Auto-amber · free at 3pm',
    tone: 'amber',
  },
  {
    id: 's4',
    time: '3:00 PM',
    title: 'Speedi job — Leak repair',
    subtitle: 'Sarah K. · Victoria Terrace',
    tone: 'speedi',
  },
  {
    id: 's5',
    time: '5:00 PM',
    title: 'Free slot',
    subtitle: 'Auto-green · Yori watching',
    tone: 'green',
  },
];

const TONE_COLOR: Record<SlotTone, string> = {
  green: '#00C67A',
  red: '#EF4444',
  amber: '#F59E0B',
  speedi: '#E64A19',
};

const TONE_PILL: Record<SlotTone, { label: string; bg: string }> = {
  green: { label: '🟢 Green', bg: '#00C67A22' },
  red: { label: '🔴 Red', bg: '#EF444422' },
  amber: { label: '🟡 Amber', bg: '#F59E0B22' },
  speedi: { label: '⚡ Speedi', bg: '#E64A1922' },
};

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeek(today: Date): Date[] {
  const dow = today.getDay();
  const diffFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffFromMonday);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const EVENT_DOTS: Record<number, string> = {
  0: '#00C67A',
  2: '#EF4444',
  4: '#E64A19',
};

export default function Calendar() {
  const today = new Date();
  const week = getWeek(today);
  const todayStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.weekStrip}>
          {week.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            const dot = EVENT_DOTS[i];
            return (
              <View key={d.toISOString()} style={styles.dayCol}>
                <Text style={styles.dayLetter}>{DAY_LETTERS[i]}</Text>
                <View style={[styles.dateWrap, isToday && styles.dateWrapToday]}>
                  <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>
                    {d.getDate()}
                  </Text>
                </View>
                {dot ? <View style={[styles.eventDot, { backgroundColor: dot }]} /> : <View style={styles.eventDotPlaceholder} />}
              </View>
            );
          })}
        </View>

        <View style={styles.gcalCard}>
          <Text style={styles.gcalIcon}>📅</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.gcalRow}>
              <Text style={styles.gcalTitle}>Google Calendar</Text>
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>✓ Live</Text>
              </View>
            </View>
            <Text style={styles.gcalSubtitle}>Syncing availability automatically</Text>
          </View>
        </View>

        <Text style={styles.todayLabel}>TODAY — {todayStr.toUpperCase()}</Text>

        {SLOTS.map((slot) => {
          const color = TONE_COLOR[slot.tone];
          const pill = TONE_PILL[slot.tone];
          return (
            <View key={slot.id} style={styles.slotCard}>
              <View style={[styles.slotBar, { backgroundColor: color }]} />
              <View style={styles.slotBody}>
                <View style={styles.slotMainRow}>
                  <Text style={styles.slotTime}>{slot.time}</Text>
                  <View style={[styles.slotPill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.slotPillText, { color }]}>{pill.label}</Text>
                  </View>
                </View>
                <Text style={styles.slotTitle}>{slot.title}</Text>
                <Text style={styles.slotSubtitle}>{slot.subtitle}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayLetter: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateWrapToday: {
    backgroundColor: '#E64A19',
  },
  dateNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dateNumToday: {
    color: '#FFFFFF',
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
  },
  eventDotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 6,
  },
  gcalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  gcalIcon: {
    fontSize: 22,
  },
  gcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gcalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  livePill: {
    backgroundColor: '#00C67A22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  livePillText: {
    color: '#00C67A',
    fontSize: 11,
    fontWeight: '700',
  },
  gcalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  todayLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 10,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  slotBar: {
    width: 4,
  },
  slotBody: {
    flex: 1,
    padding: 14,
  },
  slotMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTime: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  slotPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  slotSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
});
