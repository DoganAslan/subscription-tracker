import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, InputAccessoryView, Platform, Keyboard } from 'react-native';

export const KEYBOARD_ACCESSORY_ID = 'DONE_BAR';

export function KeyboardAccessory() {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.button}>
          <Text style={styles.text}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  button: {
    padding: 4,
  },
  text: {
    color: '#3B82F6', // Primary Accent (blueish)
    fontSize: 16,
    fontWeight: 'bold',
  },
});
