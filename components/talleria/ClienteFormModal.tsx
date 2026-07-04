import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';

import { formStyles, SimpleFormModal } from '@/components/talleria/SimpleFormModal';
import { TalleriaColors } from '@/constants/theme';
import { validateEmailOptional } from '@/lib/tallerokAuthValidation';
import type {
  TallerOkCliente,
  TallerOkCreateClientePayload,
} from '@/types/tallerokApi';

export type ClienteFormValues = TallerOkCreateClientePayload;

const EMPTY: ClienteFormValues = {
  nombre: '',
  telefono: '',
  email: '',
  documento: '',
  direccion: '',
  notas: '',
};

type ClienteFormModalProps = {
  visible: boolean;
  title: string;
  initial?: TallerOkCliente | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
};

export function ClienteFormModal({
  visible,
  title,
  initial,
  isSubmitting,
  onClose,
  onSubmit,
}: ClienteFormModalProps) {
  const [values, setValues] = useState<ClienteFormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (initial) {
      setValues({
        nombre: initial.nombre,
        telefono: initial.telefono ?? '',
        email: initial.email ?? '',
        documento: initial.documento ?? '',
        direccion: initial.direccion ?? '',
        notas: initial.notas ?? '',
      });
    } else {
      setValues(EMPTY);
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    setError(null);
    if (!values.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    const emailCheck = validateEmailOptional(values.email ?? '');
    if (!emailCheck.ok) {
      setError(emailCheck.message);
      return;
    }
    try {
      await onSubmit({
        nombre: values.nombre.trim(),
        telefono: values.telefono?.trim() || undefined,
        email: values.email?.trim() || undefined,
        documento: values.documento?.trim() || undefined,
        direccion: values.direccion?.trim() || undefined,
        notas: values.notas?.trim() || undefined,
      });
    } catch {
      // error manejado por pantalla padre
    }
  };

  return (
    <SimpleFormModal
      visible={visible}
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={!values.nombre.trim()}>
      <Text style={formStyles.fieldLabel}>Nombre *</Text>
      <TextInput
        style={formStyles.input}
        value={values.nombre}
        onChangeText={(nombre) => setValues((v) => ({ ...v, nombre }))}
        placeholder="Nombre y apellido"
        placeholderTextColor={TalleriaColors.textMuted}
      />
      <Text style={formStyles.fieldLabel}>Teléfono</Text>
      <TextInput
        style={formStyles.input}
        value={values.telefono}
        onChangeText={(telefono) => setValues((v) => ({ ...v, telefono }))}
        placeholder="+54 11 1234-5678"
        placeholderTextColor={TalleriaColors.textMuted}
        keyboardType="phone-pad"
      />
      <Text style={formStyles.fieldLabel}>Email</Text>
      <TextInput
        style={formStyles.input}
        value={values.email}
        onChangeText={(email) => setValues((v) => ({ ...v, email }))}
        placeholder="email@ejemplo.com"
        placeholderTextColor={TalleriaColors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={formStyles.fieldLabel}>Documento</Text>
      <TextInput
        style={formStyles.input}
        value={values.documento}
        onChangeText={(documento) => setValues((v) => ({ ...v, documento }))}
        placeholder="DNI / CUIT"
        placeholderTextColor={TalleriaColors.textMuted}
      />
      <Text style={formStyles.fieldLabel}>Dirección</Text>
      <TextInput
        style={formStyles.input}
        value={values.direccion}
        onChangeText={(direccion) => setValues((v) => ({ ...v, direccion }))}
        placeholder="Calle y número"
        placeholderTextColor={TalleriaColors.textMuted}
      />
      <Text style={formStyles.fieldLabel}>Notas</Text>
      <TextInput
        style={[formStyles.input, { minHeight: 72 }]}
        value={values.notas}
        onChangeText={(notas) => setValues((v) => ({ ...v, notas }))}
        placeholder="Observaciones"
        placeholderTextColor={TalleriaColors.textMuted}
        multiline
      />
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
    </SimpleFormModal>
  );
}
