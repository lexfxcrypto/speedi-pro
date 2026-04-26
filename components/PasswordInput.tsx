import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'style'> & {
  style?: StyleProp<ViewStyle>;
};

export function PasswordInput({ style, ...props }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        {...props}
        secureTextEntry={!revealed}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={() => setRevealed((v) => !v)}
        style={styles.toggle}
        disabled={props.editable === false}
        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
      >
        <Ionicons
          name={revealed ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#111111',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
