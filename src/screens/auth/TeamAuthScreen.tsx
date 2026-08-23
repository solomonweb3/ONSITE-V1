import React, { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, Field, Button } from '../../components/ui';
import { colors, font } from '../../theme';
import { Pressable, Text } from 'react-native';
import { useStore } from '../../store';

type Props = NativeStackScreenProps<AuthStackParams, 'TeamAuth'>;

export function TeamAuthScreen({ navigation }: Props) {
  const { signIn } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>Team login</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>Email and password for team owners</Subtitle>
      </View>

      <View style={{ gap: 12 }}>
        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button label="Log In" onPress={() => signIn('team')} />
        <Pressable onPress={() => navigation.navigate('JoinTeam')} style={{ paddingTop: 4 }}>
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.grey600 }}>
            Have an invite code? Join a team →
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
