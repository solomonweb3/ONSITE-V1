import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, Field, Button } from '../../components/ui';
import { colors, font } from '../../theme';
import { useStore } from '../../store';

type Props = NativeStackScreenProps<AuthStackParams, 'TeamAuth'>;

export function TeamAuthScreen({ navigation }: Props) {
  const { signInWithEmail, signUpWithEmail } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const fn = mode === 'signup' ? signUpWithEmail : signInWithEmail;
    const { error, needsConfirm } = await fn(email, password);
    setBusy(false);
    if (error) setError(error);
    else if (needsConfirm) setNotice('Account created. Check your email to confirm, then log in.');
    // On success with a session, the app switches to the main tabs automatically.
  };

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>{mode === 'signup' ? 'Create a team account' : 'Team login'}</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>Email and password for team owners</Subtitle>
      </View>

      <View style={{ gap: 12 }}>
        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 6 characters)"
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          label={mode === 'signup' ? 'Create Account' : 'Log In'}
          onPress={submit}
          loading={busy}
          disabled={!email.includes('@') || password.length < 6}
        />

        <Pressable onPress={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); setNotice(null); }} style={{ paddingTop: 4 }}>
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.grey600 }}>
            {mode === 'signup' ? 'Already have an account? Log in →' : 'New here? Create a team account →'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('JoinTeam')}>
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.grey600 }}>
            Have an invite code? Join a team →
          </Text>
        </Pressable>

        {notice ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.success }}>{notice}</Text> : null}
        {error ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.red }}>{error}</Text> : null}
      </View>
    </Screen>
  );
}
