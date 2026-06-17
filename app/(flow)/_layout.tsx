import { Stack } from 'expo-router';

import { TalleriaColors } from '@/constants/theme';

export default function FlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: TalleriaColors.background },
        headerTintColor: TalleriaColors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: TalleriaColors.background },
        headerShadowVisible: false,
      }}
    />
  );
}
