import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConnectionBadge } from '@/components/talleria/ConnectionBadge';
import { Card } from '@/components/talleria/Card';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { Screen } from '@/components/talleria/Screen';
import { TalleriaColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

const ACCENT_PRESETS = [
  { id: 'indigo', label: 'Índigo', color: '#6366f1' },
  { id: 'cyan', label: 'Cian', color: '#06b6d4' },
  { id: 'emerald', label: 'Esmeralda', color: '#10b981' },
];

const NOMBRE_PRESETS = ['TallerOK Demo', 'AutoService Norte', 'Mecánica Express'];

const DEMO_NOMBRE = 'TallerOK Demo';

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
  const {
    connectionMode,
    isApiConfigured,
    isAuthenticated,
    isRestoring,
    user,
    socio,
    authError,
    login,
    logout,
    clearAuthError,
  } = useAuth();

  const nombreDesdeApi =
    socio?.denominacion_taller?.trim() || socio?.nombre_apellido?.trim() || null;

  const [nombreTaller, setNombreTaller] = useState(DEMO_NOMBRE);
  const [accent, setAccent] = useState(ACCENT_PRESETS[0].color);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated && nombreDesdeApi) {
      setNombreTaller(nombreDesdeApi);
    }
  }, [isAuthenticated, nombreDesdeApi]);

  const iniciales = useMemo(() => getIniciales(nombreTaller), [nombreTaller]);
  const usandoDatosReales = isAuthenticated && Boolean(nombreDesdeApi);

  const handleLogin = async () => {
    clearAuthError();
    setIsLoggingIn(true);
    try {
      await login({ email: email.trim(), password });
    } catch {
      // authError ya queda en contexto
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setNombreTaller(DEMO_NOMBRE);
    setEmail('');
    setPassword('');
  };

  return (
    <Screen title="Personalización">
      <View style={styles.headerRow}>
        <Text style={styles.subtitleInline}>Identidad visual del taller</Text>
        <ConnectionBadge mode={connectionMode} compact />
      </View>

      <Card>
        <Text style={styles.label}>Conexión CRABB API</Text>
        {!isApiConfigured ? (
          <Text style={styles.muted}>
            API no configurada. Definí EXPO_PUBLIC_API_URL en .env para conectar con CRABB.
          </Text>
        ) : isRestoring ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={TalleriaColors.accent} />
            <Text style={styles.muted}>Restaurando sesión…</Text>
          </View>
        ) : isAuthenticated ? (
          <View style={styles.sessionBlock}>
            <Text style={styles.value}>{user?.name ?? 'Usuario'}</Text>
            <Text style={styles.muted}>{user?.email}</Text>
            {socio ? (
              <>
                <Text style={styles.detalle}>Socio Nº {socio.nro_socio}</Text>
                <Text style={styles.detalle}>
                  Estado: {socio.estado}
                  {socio.estado_cuota ? ` · Cuota: ${socio.estado_cuota}` : ''}
                </Text>
              </>
            ) : null}
            <PrimaryButton title="Cerrar sesión" onPress={handleLogout} />
          </View>
        ) : (
          <View style={styles.sessionBlock}>
            <Text style={styles.muted}>
              Iniciá sesión para cargar datos reales del socio/taller. Si falla, la demo sigue
              funcionando.
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={TalleriaColors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={TalleriaColors.textMuted}
              secureTextEntry
              textContentType="password"
            />
            {authError ? <Text style={styles.error}>{authError}</Text> : null}
            <PrimaryButton
              title={isLoggingIn ? 'Ingresando…' : 'Iniciar sesión CRABB'}
              onPress={handleLogin}
              disabled={isLoggingIn || !email.trim() || !password}
            />
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.label}>Logo del taller</Text>
        <View style={styles.logoRow}>
          <View style={[styles.logoCircle, { borderColor: accent }]}>
            <Text style={[styles.logoIniciales, { color: accent }]}>{iniciales}</Text>
          </View>
          <View style={styles.logoInfo}>
            <Text style={styles.logoHint}>
              {usandoDatosReales ? 'Datos desde CRABB API' : 'Placeholder circular'}
            </Text>
            <Text style={styles.logoSub}>Las iniciales se generan del nombre</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Nombre del taller</Text>
        <Text style={styles.previewName}>{nombreTaller}</Text>
        <Text style={styles.inicialesLabel}>Iniciales: {iniciales}</Text>
        {!usandoDatosReales ? (
          <View style={styles.presetList}>
            {NOMBRE_PRESETS.map((nombre) => (
              <Pressable
                key={nombre}
                onPress={() => setNombreTaller(nombre)}
                style={[styles.presetChip, nombreTaller === nombre && styles.presetChipActive]}>
                <Text
                  style={[styles.presetText, nombreTaller === nombre && styles.presetTextActive]}>
                  {nombre}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.hint}>
            Nombre tomado del socio conectado. Cerrá sesión para volver a los presets demo.
          </Text>
        )}
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
        <Text style={styles.hint}>
          {usandoDatosReales
            ? 'Branding visual local. La identidad del taller viene de CRABB.'
            : 'Los cambios de presets no se persisten en esta demo.'}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: -8,
  },
  subtitleInline: {
    flex: 1,
    fontSize: 15,
    color: TalleriaColors.textMuted,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
  muted: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    lineHeight: 20,
  },
  detalle: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
  },
  error: {
    fontSize: 14,
    color: TalleriaColors.danger,
    lineHeight: 20,
  },
  input: {
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
  },
  sessionBlock: {
    gap: 10,
    marginTop: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
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
    lineHeight: 18,
  },
});
