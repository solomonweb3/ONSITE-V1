import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, Field, Button, Meta } from '../../components/ui';
import { colors, font } from '../../theme';
import { useStore } from '../../store';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { sendPhoneCode, verifyPhoneCode } = useStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    setBusy(true);
    setError(null);
    const { error } = await sendPhoneCode(phone);
    setBusy(false);
    if (error) setError(error);
    else setSent(true);
  };

  const onVerify = async () => {
    setBusy(true);
    setError(null);
    const { error } = await verifyPhoneCode(phone, code);
    setBusy(false);
    if (error) setError(error);
    // On success the auth session updates and the app switches to the main tabs.
  };

  return (
    <Screen>
      <Header onBack={() => (sent ? setSent(false) : navigation.goBack())} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>{sent ? 'Enter your code' : 'Enter your number'}</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>
          {sent ? `Sent to ${phone}` : "We'll text you a one-time code"}
        </Subtitle>
      </View>

      {!sent ? (
        <View style={{ gap: 16 }}>
          <Field
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (___) ___-____"
            keyboardType="phone-pad"
            autoComplete="tel"
            style={{ fontFamily: font.mono }}
          />
          <Button label="Send Code" onPress={onSend} loading={busy} disabled={phone.trim().length < 8} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Field
            value={code}
            onChangeText={setCode}
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={6}
            style={{ fontFamily: font.mono, letterSpacing: 6, textAlign: 'center' }}
          />
          <Button label="Verify & Continue" onPress={onVerify} loading={busy} disabled={code.trim().length < 4} />
          <Meta style={{ textAlign: 'center' }} onPress={onSend}>
            Didn't get it? Resend code
          </Meta>
        </View>
      )}

      {error ? <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.red, marginTop: 14 }}>{error}</Text> : null}
    </Screen>
  );
}
