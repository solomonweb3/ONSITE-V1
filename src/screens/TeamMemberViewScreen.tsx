import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeamStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { StatusBadge, ProgressBar } from '../components/ui';
import { ChevronRight } from '../components/icons';
import { useStore, Activation } from '../store';
import * as api from '../data/api';

type Props = NativeStackScreenProps<TeamStackParams, 'TeamMemberView'>;

const progressOf = (a: Activation) =>
  a.items.length ? Math.round((a.items.filter((i) => i.state === 'approved').length / a.items.length) * 100) : 0;

export function TeamMemberViewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { team, myTeam } = useStore();
  const member = team.find((m) => m.id === route.params.memberId);
  const name = member?.name ?? 'Member';
  const [work, setWork] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!myTeam) return;
      try {
        const acts = await api.loadMemberActivations(myTeam.id, route.params.memberId);
        if (!cancelled) setWork(acts);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [myTeam, route.params.memberId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 20 }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← BACK TO ROSTER</Text>
          </Pressable>
          <Text style={styles.title}>{name}'s Activations</Text>
          <Text style={styles.note}>Viewing as team admin · tap an activation to see uploads & progress</Text>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 12, gap: 12 }}>
          {!loading && work.length === 0 ? (
            <Text style={styles.note}>{name} has no activations yet.</Text>
          ) : null}
          {work.map((a) => {
            const progress = progressOf(a);
            const approved = a.items.filter((i) => i.state === 'approved').length;
            return (
              <Pressable
                key={a.id}
                onPress={() => navigation.navigate('TeamActivationDetail', { activation: a, memberId: route.params.memberId, memberName: name })}
                style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.grey50 }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <StatusBadge status={a.status} />
                </View>
                <Text style={styles.cardSub}>{a.subtitle}</Text>
                <ProgressBar value={progress} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.progressMeta}>{approved}/{a.items.length} approved · {progress}%</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={styles.view}>View uploads</Text>
                    <ChevronRight size={16} color={colors.grey400} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, marginBottom: 6 },
  title: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  note: { fontFamily: font.regular, fontSize: 12, color: colors.grey600, marginTop: 4 },
  card: { borderWidth: 1, borderColor: colors.grey100, borderRadius: 12, padding: 16, gap: 10 },
  cardTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.black },
  cardSub: { fontFamily: font.regular, fontSize: 12, color: colors.grey600 },
  progressMeta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
  view: { fontFamily: font.mono, fontSize: 11, color: colors.grey600, letterSpacing: 0.2 },
});
