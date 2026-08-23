import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { IconButton, Button } from '../components/ui';
import { ChevronLeft } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'BrandPreview'>;

const deliverableStatus: Record<string, string> = {
  approved: 'Approved',
  submitted: 'Delivered',
  rejected: 'Changes requested',
  todo: 'Pending',
};

export function BrandPreviewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activation, user } = useStore();
  const a = activation(route.params.activationId);
  if (!a) return null;

  const done = a.items.filter((i) => i.state === 'approved' || i.state === 'submitted').length;
  const nextToReview = a.items.find((i) => i.state === 'submitted');

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 8 }}>
          <Text style={styles.kicker}>BRAND VIEW · READ-ONLY</Text>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.creator}>Creator: {user.handle}</Text>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
          <View style={styles.stats}>
            <Stat value={user.followers.toUpperCase()} label="Views" />
            <Stat value="6.1%" label="Engagement" />
            <Stat value={`${done}/${a.items.length}`} label="Items done" />
          </View>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 16 }}>
          <Text style={styles.section}>DELIVERABLES</Text>
        </View>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 4 }}>
          {a.items.map((i) => (
            <View key={i.id} style={styles.deliverable}>
              <Text style={styles.delTitle}>{i.title}</Text>
              <Text style={[styles.delStatus, i.state === 'todo' && { color: colors.grey600 }]}>
                {deliverableStatus[i.state]}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, paddingTop: 12 }}>
        <Button
          label={nextToReview ? 'Verify Content' : 'All content reviewed'}
          disabled={!nextToReview}
          onPress={() => nextToReview && navigation.navigate('BrandReviewItem', { activationId: a.id, itemId: nextToReview.id })}
        />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  kicker: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, letterSpacing: 0.2 },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black, marginTop: 2 },
  creator: { fontFamily: font.regular, fontSize: 13, color: colors.grey600, marginTop: 2 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.grey50, borderRadius: 12, padding: 16 },
  statValue: { fontFamily: font.bold, fontSize: 17, color: colors.black },
  statLabel: { fontFamily: font.mono, fontSize: 10, color: colors.grey600 },
  section: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4 },
  deliverable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  delTitle: { fontFamily: font.medium, fontSize: 14, color: colors.black },
  delStatus: { fontFamily: font.mono, fontSize: 11, color: colors.black },
});
