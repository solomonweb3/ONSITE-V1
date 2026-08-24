import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Field, Button, IconButton } from '../components/ui';
import { Close, Plus } from '../components/icons';
import { useStore } from '../store';
import type { BadgeStatus } from '../components/ui';

type Props = NativeStackScreenProps<HomeStackParams, 'NewActivation'>;
type Draft = { title: string; owner: 'client' | 'my'; due: string };

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segItem, on && styles.segItemOn]}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NewActivationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { createActivation } = useStore();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [status, setStatus] = useState<BadgeStatus>('Live');
  const [items, setItems] = useState<Draft[]>([{ title: '', owner: 'client', due: '' }]);
  const [busy, setBusy] = useState(false);

  const setItem = (i: number, patch: Partial<Draft>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { title: '', owner: 'client', due: '' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const canCreate = title.trim().length > 0;

  const submit = async () => {
    setBusy(true);
    const cleaned = items.filter((it) => it.title.trim().length > 0).map((it) => ({ title: it.title.trim(), owner: it.owner, due: it.due.trim() }));
    try {
      const id = await createActivation({ title: title.trim(), subtitle: subtitle.trim(), status, items: cleaned });
      navigation.replace('Checklist', { activationId: id });
    } catch (e) {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>New Activation</Text>
        <IconButton onPress={() => navigation.goBack()}>
          <Close />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Brand</Text>
        <Field value={title} onChangeText={setTitle} placeholder="e.g. Ledger Sunglasses" />

        <Text style={[styles.label, { marginTop: 16 }]}>Context</Text>
        <Field value={subtitle} onChangeText={setSubtitle} placeholder="e.g. Summer Pop-Up · Venice Beach" />

        <Text style={[styles.label, { marginTop: 16 }]}>Status</Text>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[{ key: 'Live' as BadgeStatus, label: 'Live' }, { key: 'Completed' as BadgeStatus, label: 'Completed' }]}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 }}>
          <Text style={styles.section}>DELIVERABLES</Text>
          <Pressable onPress={addItem} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Plus size={14} color={colors.black} />
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>

        {items.map((it, i) => (
          <View key={i} style={styles.itemCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field value={it.title} onChangeText={(t) => setItem(i, { title: t })} placeholder="e.g. 1x Instagram Reel" />
              </View>
              {items.length > 1 ? (
                <IconButton onPress={() => removeItem(i)}>
                  <Close size={18} color={colors.grey400} />
                </IconButton>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Segmented
                  value={it.owner}
                  onChange={(v) => setItem(i, { owner: v })}
                  options={[{ key: 'client', label: 'Client' }, { key: 'my', label: 'Mine' }]}
                />
              </View>
              <View style={{ width: 120 }}>
                <Field value={it.due} onChangeText={(t) => setItem(i, { due: t })} placeholder="Due 6:00 PM" />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
        <Button label="Create Activation" onPress={submit} loading={busy} disabled={!canCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.screenX, paddingTop: 8, paddingBottom: 12, height: 52 },
  headerTitle: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  label: { fontFamily: font.medium, fontSize: 13, color: colors.black, marginBottom: 8 },
  section: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4 },
  addText: { fontFamily: font.semibold, fontSize: 13, color: colors.black },
  itemCard: { borderWidth: 1, borderColor: colors.grey100, borderRadius: 12, padding: 12, marginBottom: 10 },
  segment: { flexDirection: 'row', backgroundColor: colors.grey100, borderRadius: 10, padding: 3 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8 },
  segItemOn: { backgroundColor: colors.white },
  segText: { fontFamily: font.medium, fontSize: 13, color: colors.grey600 },
  segTextOn: { color: colors.black, fontFamily: font.semibold },
});
