import React, { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, Field, Button, Meta } from '../../components/ui';
import { font } from '../../theme';
import { useStore } from '../../store';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useStore();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>{sent ? 'Enter your code' : 'Enter your number'}</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>
          {sent ? `Sent to ${phone || 'your phone'}` : "We'll text you a one-time code"}
        </Subtitle>
      </View>

      {!sent ? (
        <View style={{ gap: 16 }}>
          <Field
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (___) ___-____"
            keyboardType="phone-pad"
            style={{ fontFamily: font.mono }}
          />
          <Button label="Send Code" onPress={() => setSent(true)} />
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
          <Button label="Verify & Continue" onPress={() => signIn('creator')} />
          <Meta style={{ textAlign: 'center' }}>Resend code in 0:30</Meta>
        </View>
      )}
    </Screen>
  );
}
