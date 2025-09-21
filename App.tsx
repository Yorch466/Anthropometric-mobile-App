// App.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from '@/navigation/AppNavigator';
import { emiTheme } from '@/theme/emitheme';

export default function App() {
  return (
    <PaperProvider theme={emiTheme}>
      {/* Fondo global azul */}
      <View style={[styles.root, { backgroundColor: emiTheme.colors.background }]}>
        {/* Íconos claros para buen contraste sobre azul */}
        <StatusBar style="light" backgroundColor={emiTheme.colors.background} />
        <RootNavigator />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
