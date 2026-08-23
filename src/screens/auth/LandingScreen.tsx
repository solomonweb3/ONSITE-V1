import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { colors, font, space } from '../../theme';
import { Button } from '../../components/ui';

type Props = NativeStackScreenProps<AuthStackParams, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 48 }]}>
      <View style={{ gap: 8 }}>
        <Text style={styles.wordmark}>ONSITE</Text>
        <Text style={styles.tagline}>Deliver the deal. Live.</Text>
      </View>

      <View style={{ gap: 12 }}>
        <Button label="Create Account" onPress={() => navigation.navigate('AccountKind')} />
        <Button label="Log In" variant="secondary" onPress={() => navigation.navigate('AccountKind')} />
        <Text style={styles.link}>Have a brand link? Paste it here →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: space.screenX,
    justifyContent: 'space-between',
  },
  wordmark: { fontFamily: font.bold, fontSize: 34, color: colors.black, letterSpacing: 1.36 },
  tagline: { fontFamily: font.mono, fontSize: 13, color: colors.grey600 },
  link: { fontFamily: font.regular, fontSize: 13, color: colors.grey600, paddingTop: 4 },
});
