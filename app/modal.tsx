import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <Screen title="Modal" subtitle="Pantalla del template — fuera del flujo TallerOK">
      <Text style={styles.text}>
        Esta ruta se mantiene del template original. El adelanto MP se simula dentro de Presupuesto.
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
