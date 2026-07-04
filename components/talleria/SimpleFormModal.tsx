import { type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/talleria/PrimaryButton';
import { TalleriaColors } from '@/constants/theme';

type SimpleFormModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  children: ReactNode;
};

export function SimpleFormModal({
  visible,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Guardar',
  isSubmitting = false,
  submitDisabled = false,
  children,
}: SimpleFormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <PrimaryButton
            title={isSubmitting ? 'Guardando…' : submitLabel}
            onPress={onSubmit}
            disabled={isSubmitting || submitDisabled}
          />
        </View>
      </View>
    </Modal>
  );
}

export const formStyles = StyleSheet.create({
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TalleriaColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  input: {
    fontSize: 15,
    color: TalleriaColors.text,
    backgroundColor: TalleriaColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: TalleriaColors.border,
    marginTop: 4,
  },
  error: {
    fontSize: 14,
    color: TalleriaColors.danger,
    marginTop: 8,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: TalleriaColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '90%',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TalleriaColors.text,
  },
  close: {
    fontSize: 14,
    color: TalleriaColors.accent,
    fontWeight: '600',
  },
  content: {
    gap: 4,
    paddingBottom: 8,
  },
});
