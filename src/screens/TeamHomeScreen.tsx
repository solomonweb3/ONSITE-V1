import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeamStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Button, IconButton } from '../components/ui';
import { Gear } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<TeamStackParams, 'TeamHome'>;

export function TeamHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { teamName, team, pending, invites, resolveRequest, revokeInvite } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.navigate('TeamSettings')}>
          <Gear size={22} color={colors.black} />
        </IconButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8 }}>
          <Text style={styles.title}>{teamName}</Text>
          <Text style={styles.kicker}>TEAM · {team.length + 2} APPROVED MEMBERS</Text>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
          <Button label="+ Invite Team Member" onPress={() => navigation.navigate('InviteMember')} />
        </View>

        {invites.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
              <Text style={styles.section}>INVITED ({invites.length})</Text>
            </View>
            <View style={{ paddingHorizontal: space.screenX, paddingTop: 4 }}>
              {invites.map((inv) => (
                <View key={inv.id} style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingName}>{inv.name}</Text>
                    <Text style={styles.inviteMeta}>{inv.email} · code {inv.code}</Text>
                  </View>
                  <Pressable onPress={() => revokeInvite(inv.id)}>
                    <Text style={[styles.action, { color: colors.grey400 }]}>REVOKE</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {pending.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
              <Text style={styles.section}>PENDING REQUESTS ({pending.length})</Text>
            </View>
            <View style={{ paddingHorizontal: space.screenX, paddingTop: 4 }}>
              {pending.map((p) => (
                <View key={p.id} style={styles.pendingRow}>
                  <Text style={styles.pendingName}>{p.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Pressable onPress={() => resolveRequest(p.id)}>
                      <Text style={[styles.action, { color: colors.success }]}>APPROVE</Text>
                    </Pressable>
                    <Pressable onPress={() => resolveRequest(p.id)}>
                      <Text style={[styles.action, { color: colors.grey300 }]}>DENY</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 12 }}>
          <Text style={styles.section}>ROSTER</Text>
        </View>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 4 }}>
          {team.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => navigation.navigate('TeamMemberView', { memberId: m.id })}
              style={({ pressed }) => [styles.memberRow, pressed && { backgroundColor: colors.grey50 }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{m.initials}</Text>
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={styles.memberMeta}>
                  {m.liveActivations} live activation{m.liveActivations === 1 ? '' : 's'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.screenX, paddingTop: 8, height: 40, alignItems: 'center' },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  kicker: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, letterSpacing: 0.2, marginTop: 2 },
  section: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  inviteMeta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600, marginTop: 2 },
  pendingName: { fontFamily: font.medium, fontSize: 14, color: colors.black },
  action: { fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 0.2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.semibold, fontSize: 12, color: colors.grey600 },
  memberName: { fontFamily: font.medium, fontSize: 14, color: colors.black },
  memberMeta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
});
