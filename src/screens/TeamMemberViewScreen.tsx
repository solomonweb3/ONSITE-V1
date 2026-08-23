import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeamStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { StatusBadge, BadgeStatus } from '../components/ui';
import { useStore } from '../store';

type Props = NativeStackScreenProps<TeamStackParams, 'TeamMemberView'>;

const memberWork: Record<string, { title: string; subtitle: string; status: BadgeStatus }[]> = {
  m1: [
    { title: 'Rove Skincare', subtitle: 'Product Launch · Malibu', status: 'Live' },
    { title: 'Northline Apparel', subtitle: 'Launch Event', status: 'Completed' },
  ],
  m2: [{ title: 'Alta Coffee', subtitle: 'Brand Activation · Coachella', status: 'Live' }],
  m3: [{ title: 'Ledger Sunglasses', subtitle: 'Summer Pop-Up · Venice Beach', status: 'Completed' }],
};

export function TeamMemberViewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { team } = useStore();
  const member = team.find((m) => m.id === route.params.memberId);
  const work = memberWork[route.params.memberId] ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 20 }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← BACK TO ROSTER</Text>
          </Pressable>
          <Text style={styles.title}>{member?.name ?? 'Member'}'s Activations</Text>
          <Text style={styles.note}>Viewing as team admin · can edit tasks & fees, cannot capture content</Text>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 12, gap: 12 }}>
          {work.map((w, i) => (
            <View key={i} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.cardTitle}>{w.title}</Text>
                <StatusBadge status={w.status} />
              </View>
              <Text style={styles.cardSub}>{w.subtitle}</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <Pressable><Text style={styles.action}>EDIT FEE</Text></Pressable>
                <Pressable><Text style={styles.action}>EDIT TASKS</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, marginBottom: 6 },
  title: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  note: { fontFamily: font.regular, fontSize: 12, color: colors.grey600, marginTop: 4 },
  card: { borderWidth: 1, borderColor: colors.grey100, borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.black },
  cardSub: { fontFamily: font.regular, fontSize: 12, color: colors.grey600 },
  action: { fontFamily: font.monoMedium, fontSize: 10, color: colors.black, letterSpacing: 0.2 },
});
