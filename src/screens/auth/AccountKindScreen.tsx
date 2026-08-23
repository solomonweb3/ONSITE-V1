import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, SelectCard } from '../../components/ui';

type Props = NativeStackScreenProps<AuthStackParams, 'AccountKind'>;

export function AccountKindScreen({ navigation }: Props) {
  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>Get started</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>Are you a creator or logging in as a team?</Subtitle>
      </View>
      <View style={{ gap: 12 }}>
        <SelectCard
          title="I'm an individual creator"
          subtitle="Log in with your phone number"
          onPress={() => navigation.navigate('Login')}
        />
        <SelectCard
          title="I'm logging into a team"
          subtitle="Team owners use email + password"
          onPress={() => navigation.navigate('TeamAuth')}
        />
      </View>
    </Screen>
  );
}
