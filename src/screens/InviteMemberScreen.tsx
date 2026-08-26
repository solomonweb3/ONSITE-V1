import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeamStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Field, Button, IconButton } from '../components/ui';
import { Close, Check } from '../components/icons';
import { useStore, Invite } from '../store';

type Props = NativeStackScreenProps<TeamStackParams, 'InviteMember'>;

export function InviteMemberScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { inviteMember, teamName } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [created, setCreated] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setCreated(await inviteMember(name, email));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create invite');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Invite Team Member</Text>
        <IconButton onPress={() => navigation.goBack()}>
          <Close />
        </IconButton>
      </View>

      {!created ? (
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8 }}>
          <Text style={styles.sub}>They'll join {teamName} once they sign in with the invite code.</Text>

          <Text style={[styles.label, { marginTop: 20 }]}>Name</Text>
          <Field value={name} onChangeText={setName} placeholder="e.g. Ariana Ford" />

          <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
          <Field value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" />

          <View style={{ marginTop: 24 }}>
            <Button label="Generate Invite" onPress={submit} loading={busy} disabled={name.trim().length < 2 || !email.includes('@')} />
          </View>
          {error ? <Text style={[styles.sub, { color: colors.red, marginTop: 14 }]}>{error}</Text> : null}
        </View>
      ) : (
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8, alignItems: 'center' }}>
          <View style={styles.successDot}>
            <Check size={22} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Invite ready for {created.name}</Text>
          <Text style={styles.sub}>Share these — they log in with their email + this password.</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>TEMPORARY PASSWORD</Text>
            <Text style={styles.code}>{created.code}</Text>
            <Text style={styles.codeEmail}>{created.email}</Text>
          </View>

          <View style={{ width: '100%', gap: 10, marginTop: 24 }}>
            <Button label="Invite Another" variant="secondary" onPress={() => { setCreated(null); setName(''); setEmail(''); }} />
            <Button label="Done" onPress={() => navigation.goBack()} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 16, height: 52 },
  headerTitle: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  sub: { fontFamily: font.regular, fontSize: 13, color: colors.grey600, textAlign: 'center' },
  label: { fontFamily: font.medium, fontSize: 13, color: colors.black, marginBottom: 8 },
  successDot: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 16 },
  successTitle: { fontFamily: font.bold, fontSize: 18, color: colors.black, marginBottom: 4 },
  codeBox: { width: '100%', backgroundColor: colors.grey50, borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 24, gap: 6 },
  codeLabel: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4 },
  code: { fontFamily: font.bold, fontSize: 32, color: colors.black, letterSpacing: 4 },
  codeEmail: { fontFamily: font.mono, fontSize: 12, color: colors.grey600 },
});
