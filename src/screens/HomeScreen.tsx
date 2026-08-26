import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
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
  const { activations, progressOf, liveCount, completedCount } = useStore();
  const empty = activations.length === 0;

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
            <Button label="Link Email" variant="secondary" onPress={() => {}} />
          </View>
          <Text style={styles.emptyHint}>Email linking is coming soon.</Text>
        </View>
      ) : (
        <>
          <View style={styles.metaRow}>
            <Meta>{`${liveCount} LIVE  ·  ${completedCount} COMPLETED THIS MONTH`}</Meta>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 32, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {activations.map((a) => (
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
});
