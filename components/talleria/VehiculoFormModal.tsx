import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';

import { formStyles, SimpleFormModal } from '@/components/talleria/SimpleFormModal';
import { TalleriaColors } from '@/constants/theme';
import type {
  TallerOkCreateVehiculoPayload,
  TallerOkVehiculo,
} from '@/types/tallerokApi';

const EMPTY: TallerOkCreateVehiculoPayload = {
  patente: '',
  marca: '',
  modelo: '',
  anio: undefined,
  color: '',
  km: undefined,
  notas: '',
};

type VehiculoFormModalProps = {
  visible: boolean;
  title: string;
  initial?: TallerOkVehiculo | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TallerOkCreateVehiculoPayload) => Promise<void>;
};

export function VehiculoFormModal({
  visible,
  title,
  initial,
  isSubmitting,
  onClose,
  onSubmit,
}: VehiculoFormModalProps) {
  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [color, setColor] = useState('');
  const [km, setKm] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (initial) {
      setPatente(initial.patente);
      setMarca(initial.marca);
      setModelo(initial.modelo);
      setAnio(initial.anio != null ? String(initial.anio) : '');
      setColor(initial.color ?? '');
      setKm(initial.km != null ? String(initial.km) : '');
      setNotas(initial.notas ?? '');
    } else {
      setPatente('');
      setMarca('');
      setModelo('');
      setAnio('');
      setColor('');
      setKm('');
      setNotas('');
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    setError(null);
    if (!patente.trim() || !marca.trim() || !modelo.trim()) {
      setError('Patente, marca y modelo son obligatorios.');
      return;
    }
    const anioNum = anio.trim() ? Number(anio.trim()) : undefined;
    if (anio.trim() && Number.isNaN(anioNum)) {
      setError('El año debe ser un número válido.');
      return;
    }
    const kmNum = km.trim() ? Number(km.trim()) : undefined;
    if (km.trim() && Number.isNaN(kmNum)) {
      setError('El kilometraje debe ser un número válido.');
      return;
    }
    try {
      await onSubmit({
        patente: patente.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anioNum,
        color: color.trim() || undefined,
        km: kmNum,
        notas: notas.trim() || undefined,
      });
    } catch {
      // error manejado por pantalla padre
    }
  };

  const canSubmit = patente.trim().length > 0 && marca.trim().length > 0 && modelo.trim().length > 0;

  return (
    <SimpleFormModal
      visible={visible}
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={!canSubmit}>
      <Text style={formStyles.fieldLabel}>Patente *</Text>
      <TextInput
        style={formStyles.input}
        value={patente}
        onChangeText={setPatente}
        placeholder="AB 123 CD"
        placeholderTextColor={TalleriaColors.textMuted}
        autoCapitalize="characters"
      />
      <Text style={formStyles.fieldLabel}>Marca *</Text>
      <TextInput
        style={formStyles.input}
        value={marca}
        onChangeText={setMarca}
        placeholder="Toyota"
        placeholderTextColor={TalleriaColors.textMuted}
      />
      <Text style={formStyles.fieldLabel}>Modelo *</Text>
      <TextInput
        style={formStyles.input}
        value={modelo}
        onChangeText={setModelo}
        placeholder="Corolla"
        placeholderTextColor={TalleriaColors.textMuted}
      />
      <Text style={formStyles.fieldLabel}>Año</Text>
      <TextInput
        style={formStyles.input}
        value={anio}
        onChangeText={setAnio}
        placeholder="2019"
        placeholderTextColor={TalleriaColors.textMuted}
        keyboardType="number-pad"
      />
      <Text style={formStyles.fieldLabel}>Color</Text>
      <TextInput
        style={formStyles.input}
        value={color}
        onChangeText={setColor}
        placeholder="Blanco"
        placeholderTextColor={TalleriaColors.textMuted}
      />
      <Text style={formStyles.fieldLabel}>Kilometraje</Text>
      <TextInput
        style={formStyles.input}
        value={km}
        onChangeText={setKm}
        placeholder="85000"
        placeholderTextColor={TalleriaColors.textMuted}
        keyboardType="number-pad"
      />
      <Text style={formStyles.fieldLabel}>Observaciones</Text>
      <TextInput
        style={[formStyles.input, { minHeight: 72 }]}
        value={notas}
        onChangeText={setNotas}
        placeholder="Notas del vehículo"
        placeholderTextColor={TalleriaColors.textMuted}
        multiline
      />
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
    </SimpleFormModal>
  );
}
