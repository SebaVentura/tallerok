import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';

const ACCENT_PRESETS = [
  { id: 'indigo', label: 'Índigo', color: '#6366f1' },
  { id: 'cyan', label: 'Cian', color: '#06b6d4' },
  { id: 'emerald', label: 'Esmeralda', color: '#10b981' },
];

const NOMBRE_PRESETS = ['TallerOK Demo', 'AutoService Norte', 'Mecánica Express'];

function getIniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function PersonalizacionScreen() {
  const [nombreTaller, setNombreTaller] = useState('TallerOK Demo');
  const [accent, setAccent] = useState(ACCENT_PRESETS[0].color);
  const iniciales = useMemo(() => getIniciales(nombreTaller), [nombreTaller]);

  return (
    <Screen title="Personalización" subtitle="Identidad visual del taller · Demo CRABB">
      <Card>
        <Text style={styles.label}>Logo del taller</Text>
        <View style={styles.logoRow}>
          <View style={[styles.logoCircle, { borderColor: accent }]}>
            <Text style={[styles.logoIniciales, { color: accent }]}>{iniciales}</Text>
          </View>
          <View style={styles.logoInfo}>
            <Text style={styles.logoHint}>Placeholder circular</Text>
            <Text style={styles.logoSub}>Las iniciales se generan del nombre</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Nombre del taller</Text>
        <Text style={styles.previewName}>{nombreTaller}</Text>
        <Text style={styles.inicialesLabel}>Iniciales: {iniciales}</Text>
        <View style={styles.presetList}>
          {NOMBRE_PRESETS.map((nombre) => (
            <Pressable
              key={nombre}
              onPress={() => setNombreTaller(nombre)}
              style={[styles.presetChip, nombreTaller === nombre && styles.presetChipActive]}>
              <Text style={[styles.presetText, nombreTaller === nombre && styles.presetTextActive]}>
                {nombre}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Color de acento</Text>
        <View style={styles.swatches}>
          {ACCENT_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => setAccent(preset.color)}
              style={[
                styles.swatch,
                { backgroundColor: preset.color },
                accent === preset.color && styles.swatchActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.detalle}>
          Seleccionado: {ACCENT_PRESETS.find((p) => p.color === accent)?.label}
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>Vista previa del encabezado</Text>
        <View style={[styles.headerPreview, { backgroundColor: accent }]}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>{iniciales}</Text>
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerNombre}>{nombreTaller}</Text>
            <Text style={styles.headerSub}>Gestión inteligente de taller</Text>
          </View>
        </View>
        <Text style={styles.hint}>Los cambios no se persisten en esta demo.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: TalleriaColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIniciales: {
    fontSize: 28,
    fontWeight: '800',
  },
  logoInfo: {
    flex: 1,
    gap: 4,
  },
  logoHint: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  logoSub: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
  },
  previewName: {
    fontSize: 22,
    fontWeight: '700',
    color: TalleriaColors.text,
    marginTop: 8,
  },
  inicialesLabel: {
    fontSize: 14,
    color: TalleriaColors.accent,
    fontWeight: '600',
    marginTop: 4,
  },
  presetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  presetChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipActive: {
    borderColor: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}22`,
  },
  presetText: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
  },
  presetTextActive: {
    color: TalleriaColors.accent,
    fontWeight: '600',
  },
  swatches: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: TalleriaColors.text,
  },
  detalle: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    marginTop: 8,
  },
  headerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    padding: 18,
    marginTop: 10,
  },
  headerLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  headerNombre: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: '#ffffffcc',
    fontSize: 13,
  },
  hint: {
    fontSize: 13,
    color: TalleriaColors.textMuted,
    marginTop: 10,
  },
});
