import { StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';

import { formStyles } from '@/components/talleria/SimpleFormModal';
import { TalleriaColors } from '@/constants/theme';

const DEFAULT_HELPER =
  'Podés dictar usando el micrófono del teclado del celular.';

function minHeightForLines(numberOfLines: number): number {
  if (numberOfLines <= 3) return 80;
  if (numberOfLines === 4) return 96;
  return 120;
}

export type DictadoTextAreaProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numberOfLines?: number;
  editable?: boolean;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
};

export function DictadoTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  numberOfLines = 4,
  editable = true,
  helperText,
  errorText,
  required = false,
  style,
  inputStyle,
}: DictadoTextAreaProps) {
  const resolvedHelper = helperText === undefined ? DEFAULT_HELPER : helperText;

  return (
    <View style={style}>
      {label ? (
        <Text style={formStyles.fieldLabel}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}

      <TextInput
        style={[
          formStyles.input,
          styles.input,
          { minHeight: minHeightForLines(numberOfLines) },
          !editable && styles.inputDisabled,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={TalleriaColors.textMuted}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        autoCorrect
        spellCheck
        blurOnSubmit={false}
        returnKeyType="default"
        editable={editable}
      />

      {resolvedHelper ? <Text style={styles.helper}>{resolvedHelper}</Text> : null}
      {errorText ? <Text style={formStyles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: 4,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  helper: {
    fontSize: 12,
    color: TalleriaColors.textMuted,
    lineHeight: 17,
    marginTop: 6,
  },
});
