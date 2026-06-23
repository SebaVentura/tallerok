import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { TalleriaColors } from '@/constants/theme';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';

type AuthTab = 'login' | 'register';

type TallerOkAuthSectionProps = {
  variant?: 'welcome' | 'account';
};

const RUBROS = ['Mecánica general', 'Chapa y pintura', 'Gomería', 'Electricidad', 'Otro'];

export function TallerOkAuthSection({ variant = 'welcome' }: TallerOkAuthSectionProps) {
  const router = useRouter();
  const {
    isTallerOkApiConfigured,
    isAuthenticated,
    isDemoMode,
    isLoading,
    user,
    taller,
    authError,
    sessionExpired,
    login,
    registerTaller,
    logout,
    continueAsDemo,
    clearAuthError,
    clearSessionExpired,
  } = useTallerOkAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tallerNombre, setTallerNombre] = useState('');
  const [tallerTelefono, setTallerTelefono] = useState('');
  const [tallerDireccion, setTallerDireccion] = useState('');
  const [tallerRubro, setTallerRubro] = useState(RUBROS[0]);
  const [ownerNombre, setOwnerNombre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setSuccessMessage(null);
    clearAuthError();
    clearSessionExpired();
  };

  const handleLogin = async () => {
    clearAuthError();
    clearSessionExpired();
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      setSuccessMessage('Sesión iniciada correctamente.');
      setPassword('');
      router.replace('/(tabs)');
    } catch {
      // authError queda en contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    clearAuthError();
    setSuccessMessage(null);
    if (password !== confirmPassword) return;

    setIsSubmitting(true);
    try {
      await registerTaller({
        tallerNombre: tallerNombre.trim(),
        tallerTelefono: tallerTelefono.trim() || undefined,
        tallerDireccion: tallerDireccion.trim() || undefined,
        tallerRubro: tallerRubro.trim() || undefined,
        nombre: ownerNombre.trim(),
        email: email.trim(),
        password,
      });
      setSuccessMessage('Cuenta creada. Ya podés usar datos reales del taller.');
      setPassword('');
      setConfirmPassword('');
      router.replace('/(tabs)');
    } catch {
      // authError queda en contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    router.replace('/');
  };

  const handleContinueDemo = async () => {
    await continueAsDemo();
    router.replace('/(tabs)');
  };

  const passwordsMismatch =
    activeTab === 'register' && confirmPassword.length > 0 && password !== confirmPassword;

  const canLogin = email.trim().length > 0 && password.length > 0;
  const canRegister =
    tallerNombre.trim().length > 0 &&
    ownerNombre.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  if (variant === 'account') {
    return (
      <Card>
        <Text style={styles.label}>Cuenta TallerOK</Text>
        {isAuthenticated ? (
          <View style={styles.sessionBlock}>
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>Conectado a TallerOK</Text>
            </View>
            <Text style={styles.value}>{user?.nombre ?? 'Usuario'}</Text>
            <Text style={styles.muted}>{user?.email}</Text>
            {taller ? (
              <>
                <Text style={styles.detalle}>Taller: {taller.nombre}</Text>
                {taller.telefono ? <Text style={styles.detalle}>Tel: {taller.telefono}</Text> : null}
              </>
            ) : null}
            <PrimaryButton title="Cerrar sesión TallerOK" onPress={handleLogout} />
          </View>
        ) : isDemoMode ? (
          <View style={styles.sessionBlock}>
            <ConnectionBadge mode="demo" compact />
            <Text style={styles.muted}>
              Estás usando datos de demostración. Conectá tu taller para ver información real.
            </Text>
            <PrimaryButton title="Conectar TallerOK" onPress={() => router.replace('/')} />
          </View>
        ) : (
          <View style={styles.sessionBlock}>
            <Text style={styles.muted}>No hay sesión TallerOK activa.</Text>
            <PrimaryButton title="Ir a login" onPress={() => router.replace('/')} />
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card>
      {!isTallerOkApiConfigured ? (
        <View style={styles.sessionBlock}>
          <Text style={styles.muted}>
            API no configurada. Definí EXPO_PUBLIC_TALLEROK_API_URL en .env para conectar con
            TallerOK.
          </Text>
          <Pressable onPress={handleContinueDemo} style={styles.demoLink} accessibilityRole="button">
            <Text style={styles.demoLinkText}>Continuar en modo demo →</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={TalleriaColors.accent} />
          <Text style={styles.muted}>Restaurando sesión TallerOK…</Text>
        </View>
      ) : (
        <View style={styles.sessionBlock}>
          {sessionExpired ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                Tu sesión expiró. Volvé a ingresar con tu cuenta.
              </Text>
            </View>
          ) : null}

          <View style={styles.tabs}>
            <Pressable
              onPress={() => switchTab('login')}
              style={[styles.tab, activeTab === 'login' && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                Ingresar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchTab('register')}
              style={[styles.tab, activeTab === 'register' && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                Crear cuenta
              </Text>
            </Pressable>
          </View>

          {activeTab === 'register' ? (
            <>
              <Text style={styles.fieldLabel}>Nombre del taller</Text>
              <TextInput
                style={styles.input}
                value={tallerNombre}
                onChangeText={setTallerNombre}
                placeholder="Ej: Mecánica del Sur"
                placeholderTextColor={TalleriaColors.textMuted}
              />
              <Text style={styles.fieldLabel}>Teléfono del taller</Text>
              <TextInput
                style={styles.input}
                value={tallerTelefono}
                onChangeText={setTallerTelefono}
                placeholder="+54 11 1234-5678"
                placeholderTextColor={TalleriaColors.textMuted}
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={tallerDireccion}
                onChangeText={setTallerDireccion}
                placeholder="Calle y número"
                placeholderTextColor={TalleriaColors.textMuted}
              />
              <Text style={styles.fieldLabel}>Rubro</Text>
              <View style={styles.rubroRow}>
                {RUBROS.map((rubro) => (
                  <Pressable
                    key={rubro}
                    onPress={() => setTallerRubro(rubro)}
                    style={[styles.rubroChip, tallerRubro === rubro && styles.rubroChipActive]}>
                    <Text
                      style={[
                        styles.rubroChipText,
                        tallerRubro === rubro && styles.rubroChipTextActive,
                      ]}>
                      {rubro}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Tu nombre (dueño)</Text>
              <TextInput
                style={styles.input}
                value={ownerNombre}
                onChangeText={setOwnerNombre}
                placeholder="Nombre y apellido"
                placeholderTextColor={TalleriaColors.textMuted}
              />
            </>
          ) : null}

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={TalleriaColors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Text style={styles.fieldLabel}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={TalleriaColors.textMuted}
            secureTextEntry
            textContentType="password"
          />

          {activeTab === 'register' ? (
            <>
              <Text style={styles.fieldLabel}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repetí la contraseña"
                placeholderTextColor={TalleriaColors.textMuted}
                secureTextEntry
                textContentType="password"
              />
              {passwordsMismatch ? (
                <Text style={styles.error}>Las contraseñas no coinciden.</Text>
              ) : null}
            </>
          ) : null}

          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

          {activeTab === 'login' ? (
            <PrimaryButton
              title={isSubmitting ? 'Ingresando…' : 'Ingresar'}
              onPress={handleLogin}
              disabled={isSubmitting || !canLogin}
            />
          ) : (
            <PrimaryButton
              title={isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              onPress={handleRegister}
              disabled={isSubmitting || !canRegister || passwordsMismatch}
            />
          )}

          <Pressable onPress={handleContinueDemo} style={styles.demoLink} accessibilityRole="button">
            <Text style={styles.demoLinkText}>Continuar en modo demo →</Text>
          </Pressable>
          <Text style={styles.demoHint}>
            Podés usar la app sin iniciar sesión. Los datos serán de demostración.
          </Text>
        </View>
      )}
    </Card>
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
  success: {
    fontSize: 14,
    color: TalleriaColors.success,
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  sessionBlock: {
    gap: 10,
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}18`,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
  },
  tabTextActive: {
    color: TalleriaColors.accent,
  },
  rubroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rubroChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rubroChipActive: {
    borderColor: TalleriaColors.accent,
    backgroundColor: `${TalleriaColors.accent}18`,
  },
  rubroChipText: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
  },
  rubroChipTextActive: {
    color: TalleriaColors.accent,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: `${TalleriaColors.success}18`,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.success}44`,
  },
  successBannerText: {
    color: TalleriaColors.success,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: `${TalleriaColors.danger}12`,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.danger}33`,
  },
  errorBannerText: {
    color: TalleriaColors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  demoLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  demoLinkText: {
    fontSize: 14,
    color: TalleriaColors.accent,
    fontWeight: '600',
  },
  demoHint: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
});
