import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, space } from '../theme';
import { useStore } from '../store';

const week = [
  { d: 'M', n: 10 },
  { d: 'T', n: 11 },
  { d: 'W', n: 12 },
  { d: 'T', n: 13 },
  { d: 'F', n: 14 },
  { d: 'S', n: 15 },
  { d: 'S', n: 16 },
];

// Minutes from a "6:00 PM" style string, for sorting.
function toMinutes(t: string) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 9999;
  let h = parseInt(m[1], 10) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

export function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { activations } = useStore();
  const [selected, setSelected] = useState(12);

  const events = activations
    .flatMap((a) => a.items.filter((i) => /\d/.test(i.due)).map((i) => ({ time: i.due, title: i.title, brand: a.title })))
    .sort((x, y) => toMinutes(x.time) - toMinutes(y.time));

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: space.screenX, paddingTop: 24, paddingBottom: 12 }}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <View style={styles.week}>
        {week.map((w) => {
          const on = w.n === selected;
          return (
            <Pressable key={w.n} onPress={() => setSelected(w.n)} style={[styles.day, on && styles.dayOn]}>
              <Text style={[styles.dayLetter, on && { color: colors.white }]}>{w.d}</Text>
              <Text style={[styles.dayNum, on && { color: colors.white }]}>{w.n}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: space.screenX, paddingVertical: 8 }}>
        <Text style={styles.dayHeading}>WEDNESDAY, AUG {selected}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {events.map((e, i) => (
          <View key={i} style={styles.event}>
            <Text style={styles.time}>{e.time}</Text>
            <View style={{ gap: 2 }}>
              <Text style={styles.eventTitle}>{e.title}</Text>
              <Text style={styles.eventBrand}>{e.brand}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.bold, fontSize: 24, color: colors.black },
  week: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.screenX, paddingBottom: 16, paddingTop: 4 },
  day: { alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  dayOn: { backgroundColor: colors.black },
  dayLetter: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
  dayNum: { fontFamily: font.semibold, fontSize: 15, color: colors.black },
  dayHeading: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4 },
  event: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  time: { fontFamily: font.mono, fontSize: 12, color: colors.grey600, width: 60 },
  eventTitle: { fontFamily: font.medium, fontSize: 14, color: colors.black },
  eventBrand: { fontFamily: font.regular, fontSize: 12, color: colors.grey600 },
});
