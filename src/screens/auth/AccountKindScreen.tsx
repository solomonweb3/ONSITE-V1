import React from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, SelectCard } from '../../components/ui';
import { useStore } from '../../store';

type Props = NativeStackScreenProps<AuthStackParams, 'AccountKind'>;

export function AccountKindScreen({ navigation }: Props) {
  const { setRole } = useStore();
  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 6, paddingTop: 8, paddingBottom: 24 }}>
        <ScreenTitle>Get started</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>Are you setting up a team or joining one?</Subtitle>
      </View>
      <View style={{ gap: 12 }}>
        <SelectCard
          title="I'm creating a team"
          subtitle="Set up and manage your team"
          onPress={() => {
            setRole('team');
            navigation.navigate('TeamAuth');
          }}
        />
        <SelectCard
          title="I'm joining a team"
          subtitle="Log in as a team member"
          onPress={() => {
            setRole('creator');
            navigation.navigate('TeamAuth');
          }}
        />
      </View>
    </Screen>
  );
}
