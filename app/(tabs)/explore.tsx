import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';

export default function ExploreScreen() {
  return (
    <Screen title="Explore" subtitle="Pantalla del template — fuera del flujo TallerOK">
      <Text style={styles.text}>
        Esta ruta se mantiene del template original y no aparece en la barra de tabs.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: TalleriaColors.textMuted,
    lineHeight: 22,
  },
});
