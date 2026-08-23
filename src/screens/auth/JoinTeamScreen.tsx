import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { Screen, Header } from '../../components/Screen';
import { ScreenTitle, Subtitle, Button } from '../../components/ui';
import { colors, font } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParams, 'JoinTeam'>;

export function JoinTeamScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ gap: 8, paddingTop: 16, paddingBottom: 20 }}>
        <ScreenTitle style={{ fontSize: 22 }}>Join a team</ScreenTitle>
        <Subtitle style={{ fontSize: 14 }}>Enter the invite code from your team admin</Subtitle>
      </View>
      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="X 7 K 2 P 9 A B"
        placeholderTextColor={colors.grey400}
        autoCapitalize="characters"
        style={styles.codeBox}
      />
      <View style={{ height: 16 }} />
      <Button
        label="Request to Join"
        disabled={code.trim().length < 4}
        onPress={() => setNotice('Request sent. Create your account to finish joining once your admin approves.')}
      />
      {notice ? (
        <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.success, marginTop: 14 }}>{notice}</Text>
      ) : null}
      <Text
        onPress={() => navigation.navigate('TeamAuth')}
        style={{ fontFamily: font.regular, fontSize: 13, color: colors.grey600, marginTop: 12 }}
      >
        Set up your account →
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.grey300,
    borderRadius: 8,
    paddingVertical: 18,
    textAlign: 'center',
    fontFamily: font.monoMedium,
    fontSize: 18,
    letterSpacing: 1.8,
    color: colors.black,
  },
});
