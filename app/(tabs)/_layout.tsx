import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { fetchWithAuth } from '../../lib/auth';

const API = 'https://www.speeditrades.com';

export default function TabsLayout() {
  const [totalUnread, setTotalUnread] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const [msgRes, quoteRes, waitRes] = await Promise.all([
        fetchWithAuth(`${API}/api/native/messages`),
        fetchWithAuth(`${API}/api/native/quotes`),
        fetchWithAuth(`${API}/api/native/waiting-requests`),
      ]);
      const msgs = await msgRes.json();
      const quotes = await quoteRes.json();
      const waits = await waitRes.json();
      const unreadMsgs = Array.isArray(msgs)
        ? msgs.filter((m: { unread?: boolean }) => m.unread).length
        : 0;
      const unreadQuotes = typeof quotes?.unreadCount === 'number' ? quotes.unreadCount : 0;
      setTotalUnread(unreadMsgs + unreadQuotes);
      setWaitingCount(Array.isArray(waits) ? waits.length : 0);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchUnread();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E64A19',
        tabBarInactiveTintColor: '#3A3A3A',
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 83,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarBadgeStyle: {
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="waiting"
        options={{
          title: 'Waiting',
          tabBarBadge: waitingCount > 0 ? waitingCount : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, size }) => <Ionicons name="star" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => <Ionicons name="gift" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
