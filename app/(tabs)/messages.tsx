import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Message = {
  id: string;
  avatar: string;
  name: string;
  preview: string;
  time: string;
  unread: boolean;
};

const MESSAGES: Message[] = [
  {
    id: 'm1',
    avatar: '👩',
    name: 'Sarah K.',
    preview: 'Hi the pipe is still leaking slightly',
    time: '5 min ago',
    unread: true,
  },
  {
    id: 'm2',
    avatar: '👨',
    name: 'Tom B.',
    preview: 'What time can you come to look at the boiler?',
    time: '1 hr ago',
    unread: true,
  },
  {
    id: 'm3',
    avatar: '👩',
    name: 'Mike R.',
    preview: 'Thanks so much brilliant job as always!',
    time: 'Yesterday',
    unread: false,
  },
];

export default function Messages() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.linkCard, { borderLeftColor: '#E64A19' }]}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E64A1922' }]}>
            <Text style={styles.iconEmoji}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Quote Requests</Text>
            <Text style={styles.linkSubtitle}>2 new quotes waiting</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.linkCard, { borderLeftColor: '#60A5FA' }]}
        >
          <View style={[styles.iconBox, { backgroundColor: '#1E3A8A33' }]}>
            <Text style={styles.iconEmoji}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>All Messages</Text>
            <Text style={styles.linkSubtitle}>View full message history</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.recentLabel}>RECENT</Text>

        {MESSAGES.map((msg) => (
          <TouchableOpacity
            key={msg.id}
            activeOpacity={0.8}
            style={[
              styles.messageItem,
              msg.unread && { borderLeftColor: '#E64A19', borderLeftWidth: 3 },
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{msg.avatar}</Text>
            </View>
            <View style={styles.messageBody}>
              <Text style={styles.messageName}>{msg.name}</Text>
              <Text style={styles.messagePreview} numberOfLines={1}>
                {msg.preview}
              </Text>
            </View>
            <Text style={styles.messageTime}>{msg.time}</Text>
          </TouchableOpacity>
        ))}
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
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  linkTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: '#6B7280',
    fontSize: 24,
    fontWeight: '300',
  },
  recentLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  messageBody: {
    flex: 1,
  },
  messageName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  messagePreview: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  messageTime: {
    color: '#6B7280',
    fontSize: 11,
    marginLeft: 8,
  },
});
