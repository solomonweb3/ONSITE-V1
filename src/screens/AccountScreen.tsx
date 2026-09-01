import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { IconButton } from '../components/ui';
import { ChevronLeft } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<ProfileStackParams, 'Account'>;

function Row({ label, value, danger, onPress }: { label: string; value?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.grey50 }]}>
      <Text style={[styles.label, danger && { color: colors.red }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </Pressable>
  );
}

export function AccountScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut, emailConnection, connectEmail, disconnectEmail } = useStore();
  const [busy, setBusy] = React.useState(false);

  const onEmailPress = async () => {
    if (emailConnection) {
      await disconnectEmail();
      return;
    }
    setBusy(true);
    const res = await connectEmail();
    setBusy(false);
    if (res.error) Alert.alert('Connect email', res.error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>
      <View style={{ paddingHorizontal: space.screenX, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={styles.title}>Account</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Row label="Name" value={user.name} />
        <Row label="Handle" value={user.handle} />
        <Row label="Phone number" value="•••• 4821" />
        <Row
          label={emailConnection ? 'Email linked' : 'Connect Gmail / Outlook'}
          value={busy ? 'Connecting…' : emailConnection ? emailConnection.email ?? 'Linked · tap to disconnect' : 'Not linked'}
          onPress={onEmailPress}
        />
        <Row label="Subscription" value="Active" />
        <Row label="Join a team" onPress={() => {}} />
        <Row label="Log out" danger onPress={signOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.grey100,
  },
  label: { fontFamily: font.regular, fontSize: 14, color: colors.black },
  value: { fontFamily: font.mono, fontSize: 12, color: colors.grey600 },
});
