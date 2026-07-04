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
import { env } from '@/config/env';
import { TALLEROK_API_URL } from '@/config/tallerokEnv';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { navigateToWelcome } from '@/lib/navigateToWelcome';
import { validateLoginForm, validateRegisterForm } from '@/lib/tallerokAuthValidation';

type AuthTab = 'login' | 'register';

type TallerOkAuthSectionProps = {
  variant?: 'welcome' | 'account';
};

const RUBROS = ['Mecánica general', 'Chapa y pintura', 'Gomería', 'Electricidad', 'Otro'];

export function TallerOkAuthSection({ variant = 'welcome' }: TallerOkAuthSectionProps) {
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
    disableDemoMode,
    switchToDemoMode,
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
  const [isAccountAction, setIsAccountAction] = useState(false);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setSuccessMessage(null);
    setFormValidationError(null);
    clearAuthError();
    clearSessionExpired();
  };

  const handleLogin = async () => {
    clearAuthError();
    clearSessionExpired();
    setSuccessMessage(null);
    setFormValidationError(null);

    const validation = validateLoginForm(email, password);
    if (!validation.ok) {
      setFormValidationError(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      setSuccessMessage('Sesión iniciada correctamente.');
      setPassword('');
    } catch {
      // authError queda en contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    clearAuthError();
    setSuccessMessage(null);
    setFormValidationError(null);

    const validation = validateRegisterForm({
      tallerNombre,
      ownerNombre,
      email,
      password,
      confirmPassword,
    });
    if (!validation.ok) {
      setFormValidationError(validation.message);
      return;
    }

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
    } catch {
      // authError queda en contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsAccountAction(true);
    try {
      await logout();
      setSuccessMessage(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsAccountAction(false);
    }
  };

  const handleContinueDemo = async () => {
    await continueAsDemo();
  };

  const handleDisableDemo = async () => {
    setIsAccountAction(true);
    try {
      await disableDemoMode();
    } finally {
      setIsAccountAction(false);
    }
  };

  const handleConnectTallerOk = async () => {
    setIsAccountAction(true);
    try {
      await disableDemoMode();
    } finally {
      setIsAccountAction(false);
    }
  };

  const handleSwitchToDemo = async () => {
    setIsAccountAction(true);
    try {
      await switchToDemoMode();
    } finally {
      setIsAccountAction(false);
    }
  };

  const handleGoToLogin = () => {
    navigateToWelcome();
  };

  const passwordsMismatch =
    activeTab === 'register' && confirmPassword.length > 0 && password !== confirmPassword;

  const canLogin = email.trim().length > 0 && password.length > 0;
  const canRegister =
    tallerNombre.trim().length > 0 &&
    ownerNombre.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword;

  if (variant === 'account') {
    return (
      <Card>
        {isAuthenticated ? (
          <View style={styles.sessionBlock}>
            <Text style={styles.label}>Cuenta TallerOK</Text>
            <ConnectionBadge mode="tallerok_connected" compact />
            <Text style={styles.muted}>Conectado como {user?.email ?? '—'}</Text>
            <Text style={styles.detalle}>Taller: {taller?.nombre ?? '—'}</Text>
            <PrimaryButton
              title={isAccountAction ? 'Cerrando sesión…' : 'Cerrar sesión'}
              onPress={handleLogout}
              disabled={isAccountAction}
            />
            <Pressable
              onPress={handleSwitchToDemo}
              disabled={isAccountAction}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
              accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>
                {isAccountAction ? 'Cambiando…' : 'Cambiar a modo demo'}
              </Text>
            </Pressable>
          </View>
        ) : isDemoMode ? (
          <View style={styles.sessionBlock}>
            <Text style={styles.label}>Modo demo</Text>
            <ConnectionBadge mode="demo" compact />
            <Text style={styles.muted}>
              Estás usando datos de prueba. Podés conectar un taller real cuando quieras.
            </Text>
            <PrimaryButton
              title="Conectar TallerOK"
              onPress={handleConnectTallerOk}
              disabled={isAccountAction}
            />
            <Pressable
              onPress={handleDisableDemo}
              disabled={isAccountAction}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
              accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>
                {isAccountAction ? 'Desactivando…' : 'Desactivar modo demo'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sessionBlock}>
            <Text style={styles.label}>Cuenta TallerOK</Text>
            <Text style={styles.muted}>No hay una sesión activa.</Text>
            <PrimaryButton title="Ir a login" onPress={handleGoToLogin} />
            <Pressable
              onPress={handleContinueDemo}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
              accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Continuar en modo demo</Text>
            </Pressable>
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card>
      {!isTallerOkApiConfigured ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>
            La URL de API no está configurada. Revisá EXPO_PUBLIC_TALLEROK_API_URL en .env
          </Text>
        </View>
      ) : null}

      {env.isDevelopment ? (
        <Text style={styles.devApiUrl}>API: {TALLEROK_API_URL}</Text>
      ) : null}

      {isLoading ? (
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
            placeholder="Mínimo 8 caracteres"
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

          {formValidationError ? <Text style={styles.error}>{formValidationError}</Text> : null}
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
  warningBanner: {
    backgroundColor: `${TalleriaColors.accent}12`,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: `${TalleriaColors.accent}33`,
    marginBottom: 4,
  },
  warningBannerText: {
    color: TalleriaColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  devApiUrl: {
    fontSize: 11,
    color: TalleriaColors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 4,
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
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    backgroundColor: TalleriaColors.surface,
  },
  secondaryPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: TalleriaColors.text,
  },
});
