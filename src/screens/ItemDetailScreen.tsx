import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { Button, Meta } from '../components/ui';
import { Camera, Check, Close } from '../components/icons';
import { useStore, MediaFile } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'ItemDetail'>;
type Captured = MediaFile & { isVideo: boolean };

export function ItemDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activation, uploadAndSubmit, progressOf } = useStore();
  const a = activation(route.params.activationId);
  const item = a?.items.find((i) => i.id === route.params.itemId);
  const [note, setNote] = useState('');
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [showLink, setShowLink] = useState(false);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  if (!a || !item) return null;

  const isApproved = item.state === 'approved';
  const isSubmitted = item.state === 'submitted';
  const isRejected = item.state === 'rejected';

  const fromAsset = (asset: ImagePicker.ImagePickerAsset): Captured => {
    const isVideo = asset.type === 'video';
    const name = asset.fileName || `UPLOAD.${isVideo ? 'mp4' : 'jpg'}`;
    const ext = (name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).toLowerCase();
    return {
      uri: asset.uri,
      label: name,
      ext,
      contentType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      isVideo,
    };
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) setCaptured(fromAsset(res.assets[0]));
  };

  const shootPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) setCaptured(fromAsset(res.assets[0]));
  };

  const useLink = () => {
    const url = link.trim();
    if (!url) return;
    const isVideo = /\.(mp4|mov|webm)$/i.test(url);
    setCaptured({ uri: url, label: url.replace(/^https?:\/\//, '').slice(0, 40), ext: 'link', contentType: 'text/uri-list', remote: true, isVideo });
    setShowLink(false);
  };

  const submit = async () => {
    if (!captured) return;
    setBusy(true);
    await uploadAndSubmit(a.id, item.id, note || item.caption || '', captured);
    if (progressOf(a.id) === 100) navigation.replace('AllComplete', { activationId: a.id });
    else navigation.goBack();
  };

  // What to preview: a freshly captured file, or the item's existing media.
  const displayUri = captured?.uri ?? item.mediaUri;
  const displayLabel = captured?.label ?? item.photoLabel;
  const displayVideo = captured?.isVideo ?? /\.(mp4|mov|webm)$/i.test(displayLabel || '');
  const ownerLabel = item.owner === 'client' ? 'Client item' : 'My item';

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backLabel}>← BACK TO CHECKLIST</Text>
          </Pressable>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {ownerLabel} · {item.due === 'Delivered' ? 'Delivered' : `Due ${item.due}`}
          </Text>
        </View>

        {isApproved ? (
          <View style={styles.section}>
            <View style={styles.approvedBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Check size={16} color={colors.white} />
                <Text style={styles.approvedTitle}>Approved by {a.title}</Text>
              </View>
              <Text style={styles.approvedSub}>This item is locked and delivered</Text>
            </View>
          </View>
        ) : null}

        {isRejected ? (
          <View style={styles.section}>
            <View style={styles.rejectBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Close size={15} color={colors.white} />
                <Text style={styles.approvedTitle}>Revision requested</Text>
              </View>
              <Text style={[styles.approvedSub, { color: '#F3C9C4' }]}>{item.rejectReason ?? 'The brand asked for a change.'}</Text>
            </View>
          </View>
        ) : null}

        {/* Capture options (todo or rejected → resubmit) */}
        {!isApproved && !isSubmitted ? (
          <>
            <SectionLabel>{isRejected ? 'REPLACE CONTENT' : 'ADD CONTENT'}</SectionLabel>
            <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
              <CaptureCard title="Camera" sub="Shoot now" onPress={shootPhoto} />
              <CaptureCard title="Photo Library" sub="Choose existing" onPress={pickFromLibrary} />
              <CaptureCard title="Paste Link" sub="TikTok / IG URL" onPress={() => setShowLink((s) => !s)} />
            </View>
            {showLink ? (
              <View style={[styles.section, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
                <TextInput
                  value={link}
                  onChangeText={setLink}
                  placeholder="https://…"
                  placeholderTextColor={colors.grey400}
                  autoCapitalize="none"
                  style={styles.linkInput}
                />
                <Button label="Use" onPress={useLink} style={{ height: 44, paddingHorizontal: 18 }} />
              </View>
            ) : null}
          </>
        ) : null}

        {/* Media preview */}
        {displayUri ? (
          <>
            <SectionLabel>{isApproved ? 'DELIVERED' : 'CONTENT'}</SectionLabel>
            <View style={styles.section}>
              <View style={styles.previewCard}>
                {!displayVideo ? (
                  <Image source={{ uri: displayUri }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: colors.white, fontFamily: font.mono, fontSize: 10 }}>▶</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.previewTitle} numberOfLines={1}>{displayLabel}</Text>
                  <Text style={styles.previewMeta}>{isApproved ? 'Approved · Live' : captured ? 'Ready to submit' : 'Submitted · in review'}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {!isApproved ? (
          <View style={[styles.section, { paddingTop: 4 }]}>
            <View style={styles.noteBox}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note for the brand (optional)"
                placeholderTextColor={colors.grey300}
                multiline
                style={styles.noteInput}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 16, paddingTop: 4 }}>
        {isApproved ? (
          <Button label="Back to Checklist" variant="secondary" onPress={() => navigation.goBack()} />
        ) : (
          <Button
            label={isRejected ? 'Resubmit for Review' : 'Mark Item Complete'}
            onPress={submit}
            loading={busy}
            disabled={!captured && !isSubmitted}
          />
        )}
      </View>
    </View>
  );
}

function CaptureCard({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.captureCard, pressed && { backgroundColor: colors.grey50 }]}>
      <View style={styles.captureIcon}>
        <Camera size={16} color={colors.black} />
      </View>
      <Text style={styles.captureTitle}>{title}</Text>
      <Text style={styles.captureSub}>{sub}</Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={[styles.section, { paddingTop: 16, paddingBottom: 4 }]}>
      <Meta style={{ fontFamily: font.monoMedium, fontSize: 10 }}>{children}</Meta>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.screenX, paddingTop: 20, gap: 4 },
  backLabel: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, letterSpacing: 0.2, marginBottom: 4 },
  title: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  meta: { fontFamily: font.regular, fontSize: 13, color: colors.grey600 },
  section: { paddingHorizontal: space.screenX, paddingVertical: 6 },
  captureCard: { flex: 1, borderWidth: 1.5, borderColor: colors.grey300, borderRadius: 10, paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center', gap: 6 },
  captureIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.grey100, alignItems: 'center', justifyContent: 'center' },
  captureTitle: { fontFamily: font.semibold, fontSize: 12, color: colors.black },
  captureSub: { fontFamily: font.mono, fontSize: 9, color: colors.grey600, textAlign: 'center' },
  linkInput: { flex: 1, height: 44, borderWidth: 1.5, borderColor: colors.grey200, borderRadius: 10, paddingHorizontal: 14, fontFamily: font.mono, fontSize: 13, color: colors.black },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.grey50, borderRadius: 12, padding: 14 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.black },
  previewTitle: { fontFamily: font.medium, fontSize: 12, color: colors.black },
  previewMeta: { fontFamily: font.mono, fontSize: 10, color: colors.success },
  noteBox: { borderWidth: 1, borderColor: colors.grey100, borderRadius: 10, padding: 14 },
  noteInput: { fontFamily: font.mono, fontSize: 12, color: colors.black, minHeight: 20, padding: 0 },
  approvedBanner: { backgroundColor: colors.black, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  approvedTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.white },
  approvedSub: { fontFamily: font.mono, fontSize: 11, color: colors.grey300 },
  rejectBanner: { backgroundColor: colors.red, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
});
