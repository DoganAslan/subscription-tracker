import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#030712', padding: 24 }}>
      <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>Profile Details</Text>
      <Text style={{ color: '#94A3B8', marginTop: 12 }}>Name: dogan aslan</Text>
      <Text style={{ color: '#94A3B8' }}>Status: Bilgisayar Mühendisliği Student</Text>
    </SafeAreaView>
  );
}
