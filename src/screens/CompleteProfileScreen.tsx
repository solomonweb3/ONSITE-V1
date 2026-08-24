import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { IconButton, Button } from '../components/ui';
import { ChevronLeft, Check } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<ProfileStackParams, 'CompleteProfile'>;

const doneSteps = [
  { title: 'Verify phone number' },
  { title: 'Add your name' },
  { title: 'Choose a handle', sub: '@solomon' },
  { title: 'Add a profile photo' },
];
const optionalSteps = [
  { key: 'gmail', title: 'Link Gmail or Outlook', sub: 'Auto-suggests activations from email' },
  { key: 'notifs', title: 'Set notification preferences' },
];

function Ring({ done, total }: { done: number; total: number }) {
  const size = 128;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = done / total;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.grey100} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.black}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringValue}>{done}/{total}</Text>
      <Text style={styles.ringLabel}>COMPLETE</Text>
    </View>
  );
}

export function CompleteProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { completeProfile } = useStore();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const doneCount = doneSteps.length + optionalSteps.filter((s) => checked[s.key]).length;
  const total = doneSteps.length + optionalSteps.length;
  const allDone = doneCount === total;

  const toggle = (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: space.screenX, paddingTop: 12 }}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>Brands see a stronger profile before offering deals</Text>
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Ring done={doneCount} total={total} />
        </View>

        <View style={{ paddingHorizontal: space.screenX }}>
          {doneSteps.map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.checkOn}>
                <Check size={12} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepDone}>{s.title}</Text>
                {s.sub ? <Text style={styles.stepSub}>{s.sub}</Text> : null}
              </View>
            </View>
          ))}
          {optionalSteps.map((s) => {
            const on = checked[s.key];
            return (
              <Pressable key={s.key} onPress={() => toggle(s.key)} style={styles.step}>
                <View style={on ? styles.checkOn : styles.checkOff}>{on ? <Check size={12} color={colors.white} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTodo}>{s.title}</Text>
                  {s.sub ? <Text style={styles.stepSub}>{s.sub}</Text> : null}
                </View>
                {!on ? <Text style={styles.arrow}>→</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, paddingTop: 4 }}>
        <Button
          label={allDone ? 'Finish' : 'Save & Continue'}
          onPress={() => {
            if (allDone) completeProfile();
            navigation.goBack();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  subtitle: { fontFamily: font.regular, fontSize: 13, color: colors.grey600, marginTop: 2 },
  ringValue: { fontFamily: font.bold, fontSize: 26, color: colors.black },
  ringLabel: { fontFamily: font.mono, fontSize: 9, color: colors.grey600, letterSpacing: 0.4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  checkOn: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  checkOff: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.grey300, backgroundColor: colors.white },
  stepDone: { fontFamily: font.regular, fontSize: 14.5, color: colors.grey600 },
  stepTodo: { fontFamily: font.medium, fontSize: 14.5, color: colors.black },
  stepSub: { fontFamily: font.mono, fontSize: 10.5, color: colors.grey600, marginTop: 2 },
  arrow: { fontFamily: font.regular, fontSize: 15, color: colors.grey300 },
});
