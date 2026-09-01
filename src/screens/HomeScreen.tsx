import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { ScreenTitle, Meta, Button } from '../components/ui';
import { Plus } from '../components/icons';
import { ActivationCard } from '../components/ActivationCard';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { activations, drafts, progressOf, liveCount, completedCount, emailConnection, connectEmail, syncEmail, confirmDraft, dismissDraft } = useStore();
  const confirmed = activations.filter((a) => !a.isDraft);
  const empty = confirmed.length === 0 && drafts.length === 0;
  const [linking, setLinking] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const onLinkEmail = async () => {
    setLinking(true);
    const res = await connectEmail();
    setLinking(false);
    if (res.error) Alert.alert('Link email', res.error);
  };

  const onSync = async () => {
    setSyncing(true);
    try {
      const { created } = await syncEmail();
      if (created === 0) Alert.alert('Sync email', 'No new brand emails found.');
    } catch (e) {
      Alert.alert('Sync email', e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.header}>
        <ScreenTitle>Activations</ScreenTitle>
        <Pressable style={styles.add} onPress={() => navigation.navigate('NewActivation')}>
          <Plus size={22} color={colors.white} />
        </Pressable>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <View style={styles.emptyMark}>
            <Plus size={26} color={colors.grey400} />
          </View>
          <Text style={styles.emptyTitle}>No activations yet</Text>
          <Text style={styles.emptyBody}>
            Create your first activation to start tracking deliverables — or link your email to add them automatically.
          </Text>
          <View style={{ width: '100%', gap: 10, marginTop: 24 }}>
            <Button label="Create Activation" onPress={() => navigation.navigate('NewActivation')} />
            <Button
              label={emailConnection ? 'Email Linked ✓' : linking ? 'Connecting…' : 'Link Email'}
              variant="secondary"
              onPress={onLinkEmail}
              disabled={!!emailConnection || linking}
            />
          </View>
          <Text style={styles.emptyHint}>
            {emailConnection ? `Linked to ${emailConnection.email ?? 'your inbox'}.` : 'Connect Gmail to auto-suggest activations from brand emails.'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.metaRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Meta>{`${liveCount} LIVE  ·  ${completedCount} COMPLETED THIS MONTH`}</Meta>
              {emailConnection ? (
                <Pressable onPress={onSync} disabled={syncing} hitSlop={8}>
                  <Text style={styles.syncLink}>{syncing ? 'Syncing…' : '↻ Sync email'}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 32, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {drafts.length > 0 ? (
              <View style={{ gap: 10 }}>
                <Meta style={{ color: colors.grey600 }}>SUGGESTED FROM EMAIL</Meta>
                {drafts.map((d) => (
                  <View key={d.id} style={styles.draftCard}>
                    <Text style={styles.draftTitle} numberOfLines={2}>{d.title}</Text>
                    <Text style={styles.draftSub} numberOfLines={1}>From {d.subtitle || 'a brand email'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <Pressable onPress={() => confirmDraft(d.id)} style={styles.draftConfirm}>
                        <Text style={styles.draftConfirmText}>Add activation</Text>
                      </Pressable>
                      <Pressable onPress={() => dismissDraft(d.id)} style={styles.draftDismiss}>
                        <Text style={styles.draftDismissText}>Dismiss</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                <View style={{ height: 4 }} />
              </View>
            ) : null}
            {confirmed.map((a) => (
              <ActivationCard
                key={a.id}
                activation={a}
                progress={progressOf(a.id)}
                onPress={() => navigation.navigate('Checklist', { activationId: a.id })}
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingTop: 24,
    paddingBottom: 16,
  },
  add: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { paddingHorizontal: space.screenX, paddingBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyMark: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: colors.grey200,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontFamily: font.bold, fontSize: 18, color: colors.black, marginBottom: 8 },
  emptyBody: { fontFamily: font.regular, fontSize: 14, color: colors.grey600, textAlign: 'center', lineHeight: 20 },
  emptyHint: { fontFamily: font.mono, fontSize: 11, color: colors.grey400, marginTop: 14 },
  syncLink: { fontFamily: font.mono, fontSize: 11, color: colors.black, letterSpacing: 0.2 },
  draftCard: { borderWidth: 1, borderColor: colors.grey200, borderRadius: 12, padding: 14, backgroundColor: colors.grey50 },
  draftTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.black },
  draftSub: { fontFamily: font.mono, fontSize: 11, color: colors.grey600, marginTop: 2 },
  draftConfirm: { backgroundColor: colors.black, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  draftConfirmText: { fontFamily: font.semibold, fontSize: 12, color: colors.white },
  draftDismiss: { borderWidth: 1, borderColor: colors.grey300, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  draftDismissText: { fontFamily: font.semibold, fontSize: 12, color: colors.grey600 },
});
