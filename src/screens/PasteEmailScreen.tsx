import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Button, IconButton } from '../components/ui';
import { Close } from '../components/icons';
import { useStore } from '../store';
import { parseBrandEmail } from '../lib/parseBrandEmail';

type Props = NativeStackScreenProps<HomeStackParams, 'PasteEmail'>;

export function PasteEmailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { addEmailDraft } = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  // Live preview so the creator sees what the draft will look like.
  const preview = useMemo(() => (text.trim().length > 12 ? parseBrandEmail(text) : null), [text]);

  const submit = async () => {
    setBusy(true);
    try {
      await addEmailDraft(text);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not create draft', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={styles.topBar}>
        <IconButton onPress={() => navigation.goBack()} style={{ marginLeft: -6 }}>
          <Close />
        </IconButton>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.screenX, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Paste a brand email</Text>
        <Text style={styles.subtitle}>
          Copy the collab email from any inbox and paste it below — we'll turn it into a draft activation you can confirm.
        </Text>

        <View style={styles.textArea}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={'Subject: Summer collab with Alta Coffee\nFrom: partnerships@altacoffee.com\n\nHi! We’d love 2x TikToks and 1 Instagram Reel for our Coachella activation…'}
            placeholderTextColor={colors.grey400}
            multiline
            autoFocus
            style={styles.input}
          />
        </View>

        {preview ? (
          <View style={styles.preview}>
            <Text style={styles.previewKicker}>DRAFT PREVIEW</Text>
            <Text style={styles.previewTitle} numberOfLines={2}>{preview.title}</Text>
            <Text style={styles.previewBrand}>From {preview.brand || 'a brand email'}</Text>
            <View style={{ height: 8 }} />
            {preview.items.map((it, i) => (
              <View key={i} style={styles.previewItem}>
                <View style={styles.dot} />
                <Text style={styles.previewItemText}>{it.title}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.hint}>Paste the email above to see the draft it will create.</Text>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
        <Button label="Create draft activation" onPress={submit} loading={busy} disabled={!preview} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: space.screenX, paddingTop: 8, height: 40, justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 22, color: colors.black, marginTop: 4 },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: colors.grey600, marginTop: 6, lineHeight: 20 },
  textArea: { borderWidth: 1.5, borderColor: colors.black, borderRadius: 12, padding: 14, minHeight: 180, marginTop: 18 },
  input: { fontFamily: font.mono, fontSize: 13, color: colors.black, minHeight: 150, padding: 0, textAlignVertical: 'top', lineHeight: 19 },
  hint: { fontFamily: font.mono, fontSize: 11, color: colors.grey400, marginTop: 16 },
  preview: { borderWidth: 1, borderColor: colors.grey200, backgroundColor: colors.grey50, borderRadius: 12, padding: 16, marginTop: 18 },
  previewKicker: { fontFamily: font.monoMedium, fontSize: 10, color: colors.grey600, letterSpacing: 0.4, marginBottom: 8 },
  previewTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.black },
  previewBrand: { fontFamily: font.mono, fontSize: 11, color: colors.grey600, marginTop: 2 },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.black },
  previewItemText: { fontFamily: font.medium, fontSize: 13, color: colors.black },
});
