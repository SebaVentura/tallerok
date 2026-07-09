import { Tabs } from 'expo-router';

import { AuthGate } from '@/components/talleria/AuthGate';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TalleriaColors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: TalleriaColors.tabBar,
            borderTopColor: TalleriaColors.border,
          },
          tabBarActiveTintColor: TalleriaColors.accent,
          tabBarInactiveTintColor: TalleriaColors.textMuted,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="clientes"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="ordenes"
          options={{
            title: 'Órdenes',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="wrench.and.screwdriver.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="personalizacion"
          options={{
            title: 'Estilo',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="paintbrush.fill" color={color} />,
          }}
        />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </AuthGate>
  );
}
