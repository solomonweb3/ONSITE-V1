import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, font, radius } from '../theme';
import { Check } from './icons';
import { ChecklistItem } from '../store';

const stateHint: Record<string, string> = {
  submitted: 'Submitted · in review',
  approved: 'Approved',
  rejected: 'Needs changes',
};

export function ChecklistRow({ item, onPress }: { item: ChecklistItem; onPress?: () => void }) {
  const checked = item.state === 'approved';
  const ownerLabel = item.owner === 'client' ? 'Client item' : 'My item';
  const rightHint = stateHint[item.state];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.grey50 }]}>
      <View
        style={[
          styles.box,
          checked && { backgroundColor: colors.black, borderColor: colors.black },
          item.state === 'submitted' && { borderColor: colors.black },
          item.state === 'rejected' && { borderColor: colors.red },
        ]}
      >
        {checked ? <Check size={14} color={colors.white} /> : null}
      </View>
      <View style={{ gap: 3, flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {ownerLabel} · {item.due === 'Delivered' ? 'Delivered' : `Due ${item.due}`}
        </Text>
      </View>
      {rightHint ? (
        <Text style={[styles.hint, item.state === 'rejected' && { color: colors.red }, checked && { color: colors.green }]}>
          {rightHint}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  title: { fontFamily: font.medium, fontSize: 15, color: colors.black },
  meta: { fontFamily: font.mono, fontSize: 11, color: colors.grey600 },
  hint: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, letterSpacing: 0.2 },
});
