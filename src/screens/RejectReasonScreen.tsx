import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Button, IconButton } from '../components/ui';
import { Close } from '../components/icons';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'RejectReason'>;

const commonReasons = ['Logo not visible', 'Wrong hashtag', 'Low quality', 'Off-brand tone'];

export function RejectReasonScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activation, rejectItem } = useStore();
  const a = activation(route.params.activationId);
  const item = a?.items.find((i) => i.id === route.params.itemId);
  const [reason, setReason] = useState('');
  if (!a || !item) return null;

  const send = () => {
    rejectItem(a.id, item.id, reason.trim());
    // Return to the brand preview (pop the reject modal + review screen).
    navigation.navigate('BrandPreview', { activationId: a.id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <Close />
        </IconButton>
      </View>

      <View style={{ paddingHorizontal: space.screenX, paddingTop: 12, flex: 1 }}>
        <Text style={styles.title}>Why are you rejecting this?</Text>
        <Text style={styles.subtitle}>{item.title} · your note goes directly to the creator</Text>

        <Text style={[styles.kicker, { color: colors.pendingAmber, marginTop: 16 }]}>REQUIRED</Text>
        <View style={styles.textArea}>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="The logo isn't visible in the first 2 seconds — can you retrim so it's on screen right at the open?"
            placeholderTextColor={colors.grey400}
            multiline
            style={styles.input}
          />
        </View>

        <Text style={[styles.kicker, { marginTop: 16 }]}>COMMON REASONS</Text>
        <View style={styles.chips}>
          {commonReasons.map((r) => (
            <Pressable key={r} onPress={() => setReason(r)} style={styles.chip}>
              <Text style={styles.chipText}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 20, paddingTop: 12 }}>
        <Button label="Send Rejection" onPress={send} disabled={reason.trim().length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  subtitle: { fontFamily: font.regular, fontSize: 13, color: colors.grey600, marginTop: 4 },
  kicker: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4, marginBottom: 8 },
  textArea: { borderWidth: 1.5, borderColor: colors.black, borderRadius: 10, padding: 16, minHeight: 112 },
  input: { fontFamily: font.regular, fontSize: 14, color: colors.black, minHeight: 80, padding: 0, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.grey100, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontFamily: font.medium, fontSize: 12, color: colors.black },
});
