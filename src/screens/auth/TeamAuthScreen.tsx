import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, Field, Button } from '../../components/ui';
import { colors, font } from '../../theme';
import { useStore } from '../../store';

type Props = NativeStackScreenProps<AuthStackParams, 'TeamAuth'>;

export function TeamAuthScreen({ navigation }: Props) {
  const { signInWithEmail, user } = useStore();
  const joining = user.role === 'creator';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error } = await signInWithEmail(email, password);
    setBusy(false);
    if (error) setError(error);
    // On success the session updates and the app switches to the main tabs.
  };

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>{joining ? 'Member login' : 'Team owner login'}</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>
          {joining ? 'Log in with the credentials your team gave you' : 'Log in to set up and manage your team'}
        </Subtitle>
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
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
        />
        <Button label="Log In" onPress={submit} loading={busy} disabled={!email.includes('@') || password.length < 6} />

        {error ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.red }}>{error}</Text> : null}
      </View>
    </Screen>
  );
}
