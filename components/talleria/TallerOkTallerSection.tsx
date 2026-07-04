import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/talleria/Card';
import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { TalleriaColors } from '@/constants/theme';
import { useTallerOkAuth } from '@/hooks/useTallerOkAuth';
import { TallerOkApiError } from '@/services/tallerok/tallerokClient';
import { getTallerMe, updateTallerMe } from '@/services/tallerok/tallerokTallerApi';
import type { TallerOkTaller, TallerOkUpdateTallerPayload } from '@/types/tallerokApi';

const RUBROS = ['Mecánica general', 'Chapa y pintura', 'Gomería', 'Electricidad', 'Otro'];

export function TallerOkTallerSection() {
  const { isAuthenticated, refreshMe } = useTallerOkAuth();

  const [taller, setTaller] = useState<TallerOkTaller | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rubro, setRubro] = useState(RUBROS[0]);

  const loadTaller = useCallback(async () => {
    if (!isAuthenticated) {
      setTaller(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getTallerMe();
      setTaller(data);
      setNombre(data.nombre);
      setTelefono(data.telefono ?? '');
      setDireccion(data.direccion ?? '');
      setRubro(data.rubro ?? RUBROS[0]);
    } catch (err) {
      const message =
        err instanceof TallerOkApiError ? err.message : 'No se pudieron cargar los datos del taller.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void loadTaller();
    }, [loadTaller]),
  );

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Datos incompletos', 'El nombre del taller es obligatorio.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const payload: TallerOkUpdateTallerPayload = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      rubro: rubro.trim() || undefined,
    };

    try {
      const updated = await updateTallerMe(payload);
      setTaller(updated);
      setNombre(updated.nombre);
      setTelefono(updated.telefono ?? '');
      setDireccion(updated.direccion ?? '');
      setRubro(updated.rubro ?? RUBROS[0]);
      setIsEditing(false);
      setSuccess('Datos del taller actualizados.');
      await refreshMe();
    } catch (err) {
      const message =
        err instanceof TallerOkApiError ? err.message : 'No se pudieron guardar los cambios.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Card>
      <Text style={styles.label}>Datos del taller</Text>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={TalleriaColors.accent} />
          <Text style={styles.muted}>Cargando datos…</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {!isLoading && taller ? (
        isEditing ? (
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre del taller"
              placeholderTextColor={TalleriaColors.textMuted}
            />
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+54 11 1234-5678"
              placeholderTextColor={TalleriaColors.textMuted}
              keyboardType="phone-pad"
            />
            <Text style={styles.fieldLabel}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Calle y número"
              placeholderTextColor={TalleriaColors.textMuted}
            />
            <Text style={styles.fieldLabel}>Rubro</Text>
            <View style={styles.rubroRow}>
              {RUBROS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setRubro(item)}
                  style={[styles.rubroChip, rubro === item && styles.rubroChipActive]}>
                  <Text style={[styles.rubroChipText, rubro === item && styles.rubroChipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton
              title={isSaving ? 'Guardando…' : 'Guardar cambios'}
              onPress={handleSave}
              disabled={isSaving || !nombre.trim()}
            />
            <Pressable
              onPress={() => {
                setIsEditing(false);
                if (taller) {
                  setNombre(taller.nombre);
                  setTelefono(taller.telefono ?? '');
                  setDireccion(taller.direccion ?? '');
                  setRubro(taller.rubro ?? RUBROS[0]);
                }
              }}
              style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.readonly}>
            <Text style={styles.value}>{taller.nombre}</Text>
            {taller.telefono ? <Text style={styles.muted}>{taller.telefono}</Text> : null}
            {taller.direccion ? <Text style={styles.muted}>{taller.direccion}</Text> : null}
            {taller.rubro ? <Text style={styles.muted}>Rubro: {taller.rubro}</Text> : null}
            <PrimaryButton title="Editar datos del taller" onPress={() => setIsEditing(true)} />
          </View>
        )
      ) : null}
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  form: {
    gap: 8,
    marginTop: 8,
  },
  readonly: {
    gap: 6,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
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
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: TalleriaColors.textMuted,
    fontWeight: '600',
  },
});
