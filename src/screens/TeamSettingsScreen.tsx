import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeamStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { IconButton } from '../components/ui';
import { ChevronLeft } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<TeamStackParams, 'TeamSettings'>;

function Row({ label, value, danger, onPress }: { label: string; value?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.grey50 }]}>
      <Text style={[styles.label, danger && { color: colors.red }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
    </Pressable>
  );
}

export function TeamSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { teamName, myTeam, renameTeam, signOut } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(teamName);

  const saveName = () => {
    const n = draft.trim();
    if (n && n !== teamName) renameTeam(n);
    setEditing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <ChevronLeft />
        </IconButton>
      </View>
      <View style={{ paddingHorizontal: space.screenX, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={styles.title}>Team Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {editing ? (
          <View style={styles.row}>
            <Text style={styles.label}>Team name</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              onSubmitEditing={saveName}
              onBlur={saveName}
              style={styles.editInput}
              placeholder="Team name"
              placeholderTextColor={colors.grey400}
            />
          </View>
        ) : (
          <Row label="Team name" value={myTeam ? `${teamName}  ✎` : teamName} onPress={myTeam ? () => { setDraft(teamName); setEditing(true); } : undefined} />
        )}
        <Row label="Team photo" value="Edit →" onPress={() => {}} />
        <Row label="Change password" onPress={() => {}} />
        <Row label="Manage subscription" value="Active" onPress={() => {}} />
        <Row label="Log out" danger onPress={signOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.grey100 },
  label: { fontFamily: font.regular, fontSize: 14, color: colors.black },
  value: { fontFamily: font.mono, fontSize: 12, color: colors.grey600 },
  editInput: { fontFamily: font.regular, fontSize: 14, color: colors.black, textAlign: 'right', minWidth: 160, padding: 0 },
});
