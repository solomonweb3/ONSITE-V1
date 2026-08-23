import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, space } from '../theme';
import { ScreenTitle, Meta } from '../components/ui';
import { Plus } from '../components/icons';
import { ActivationCard } from '../components/ActivationCard';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { activations, progressOf, liveCount, completedCount } = useStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.header}>
        <ScreenTitle>Activations</ScreenTitle>
        <Pressable style={styles.add} onPress={() => {}}>
          <Plus size={22} color={colors.white} />
        </Pressable>
      </View>
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
});
