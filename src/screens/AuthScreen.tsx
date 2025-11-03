import React, { useMemo, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Card, Text, TextInput, Button, HelperText, Divider, useTheme, type MD3Theme } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { handleLogin, handleSignup } from '@/hooks/auth';
import { RANKS, type RankCategory } from '@/constants/ranks';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const nav = useNavigation<any>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<string>('');
  const [rankCat, setRankCat] = useState<RankCategory | ''>('');
  const [rank, setRank] = useState<string>('');
  const rankOptions = useMemo(() => (rankCat ? RANKS[rankCat].options : []), [rankCat]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const passwordTooShort = password.length > 0 && password.length < 6;
  const validAge = () => {
    const n = Number(age);
    return Number.isFinite(n) && n >= 16 && n <= 80;
  };

  async function onSubmit() {
    setErr('');
    if (!email.trim()) return setErr('Ingresa tu correo.');
    if (!password.trim()) return setErr('Ingresa tu contraseña.');
    if (password.length < 6) return setErr('La contraseña es muy corta (mínimo 6 caracteres).');

    try {
      setLoading(true);
      if (mode === 'login') {
        await handleLogin(email, password);
      } else {
        if (!displayName.trim()) return setErr('Ingresa tu nombre.');
        if (!validAge()) return setErr('Edad inválida (16–80).');
        if (!rankCat || !rank) return setErr('Selecciona tu grado.');

        await handleSignup(email, password, displayName, {
          age: Number(age),
          rankCategory: rankCat,
          rank,
        });
      }
      // Solo navega si la ruta existe en el árbol actual (evita el warning/crash)
      const state = nav.getState?.();
      if (state?.routeNames?.includes('Dashboard')) {
        nav.navigate('Dashboard');
      } else {
        console.log('Aún no está montado Dashboard; RootNavigator lo cargará solo.');
      };
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.root}>

          {/* ===== Marca: solo texto, sin fondo ===== */}
          <Text style={styles.brandTitle}>EMI — FITNESS</Text>

          {/* ===== Card principal ===== */}
          <Card style={styles.card}>
            <Card.Content>
              {/* Subtítulo dentro del Card */}
              <Text style={styles.cardSubtitle}>
                {mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
              </Text>

              {/* Toggle login/registro */}
              <View style={styles.toggle}>
                <Button
                  mode={mode === 'login' ? 'contained' : 'text'}
                  style={styles.toggleBtn}
                  onPress={() => setMode('login')}
                >
                  Ingresar
                </Button>
                <Button
                  mode={mode === 'register' ? 'contained' : 'text'}
                  style={styles.toggleBtn}
                  onPress={() => setMode('register')}
                >
                  Registrarse
                </Button>
              </View>

              {mode === 'register' && (
                <TextInput
                  mode="outlined"
                  label="Nombre completo"
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.input}
                />
              )}

              <TextInput
                mode="outlined"
                label="Correo"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="Contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                error={passwordTooShort}
              />
              <HelperText type="error" visible={passwordTooShort}>
                Mínimo 6 caracteres.
              </HelperText>

              {mode === 'register' && (
                <>
                  <Divider style={{ marginVertical: 8 }} />
                  <Text variant="labelLarge">Edad</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Ej. 25"
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                    style={styles.input}
                  />

                  <Text variant="labelLarge">Categoría</Text>
                  <View style={styles.pickerBox}>
                    <Picker
                      selectedValue={rankCat}
                      onValueChange={(v) => { setRankCat(v); setRank(''); }}
                      dropdownIconColor={theme.colors.onSurface}
                    >
                      <Picker.Item label="Selecciona..." value="" />
                      {Object.entries(RANKS).map(([key, group]) => (
                        <Picker.Item key={key} label={group.label} value={key} />
                      ))}
                    </Picker>
                  </View>

                  <Text variant="labelLarge">Grado</Text>
                  <View style={styles.pickerBox}>
                    <Picker
                      enabled={!!rankCat}
                      selectedValue={rank}
                      onValueChange={setRank}
                      dropdownIconColor={theme.colors.onSurface}
                    >
                      <Picker.Item label={rankCat ? 'Selecciona...' : 'Elige categoría primero'} value="" />
                      {rankOptions.map((o) => (
                        <Picker.Item key={o.value} label={o.label} value={o.value} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {!!err && <HelperText type="error" visible>{err}</HelperText>}

              <Button
                mode="contained"
                style={styles.submit}
                onPress={onSubmit}
                loading={loading}
                disabled={loading}
              >
                {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </Button>
            </Card.Content>
          </Card>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
      gap: 12,
      backgroundColor: theme.colors.background, // azul
    },

    // Marca: texto grande, amarillo, sin fondo
    brandTitle: {
      color: theme.colors.primary, // amarillo
      fontSize: 28,                // más grande
      fontWeight: '800',
      letterSpacing: 0.5,
      textAlign: 'center',
    },

    // Card blanca (surface)
    card: {
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },

    // Subtítulo dentro del card
    cardSubtitle: {
      color: theme.colors.onSurface,
      opacity: 0.8,
      fontSize: 13,
      marginBottom: 4,
      textAlign: 'center',
    },

    // Toggle
    toggle: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 4,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    toggleBtn: { flex: 1, borderRadius: 8 },

    input: {
      marginTop: 8,
      backgroundColor: theme.colors.surface,
    },

    submit: {
      marginTop: 12,
      borderRadius: 10,
    },

    pickerBox: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 10,
      overflow: 'hidden',
      marginTop: 6,
      marginBottom: 8,
      backgroundColor: theme.colors.surface,
    },
  });

export { makeStyles };
