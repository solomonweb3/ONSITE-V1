import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { VideoPreview, isVideoLabel } from '../components/VideoPreview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParams } from '../navigation/types';
import { colors, font, space } from '../theme';
import { useStore } from '../store';

type Props = NativeStackScreenProps<HomeStackParams, 'BrandReviewItem'>;

export function BrandReviewItemScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activation, approveItem, user } = useStore();
  const a = activation(route.params.activationId);
  const item = a?.items.find((i) => i.id === route.params.itemId);
  if (!a || !item) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
      <View style={{ flex: 1 }}>
        <View style={styles.head}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← BACK TO ACTIVATION</Text>
          </Pressable>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>Submitted by {user.handle} · 9:12 AM</Text>
        </View>

        <View style={{ paddingHorizontal: space.screenX, paddingTop: 16, flex: 1 }}>
          {item.mediaUri && (isVideoLabel(item.photoLabel) || isVideoLabel(item.mediaUri)) ? (
            <VideoPreview uri={item.mediaUri} style={styles.preview} />
          ) : item.mediaUri ? (
            <Image source={{ uri: item.mediaUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.preview}>
              <Text style={styles.previewText}>▶ PREVIEW</Text>
            </View>
          )}
          {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: space.screenX, paddingBottom: insets.bottom + 20, paddingTop: 16, gap: 10 }}>
        <Pressable
          onPress={() => {
            approveItem(a.id, item.id);
            navigation.goBack();
          }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.approveBg }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.actionLabel, { color: colors.approveText }]}>Approve</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('RejectReason', { activationId: a.id, itemId: item.id })}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.rejectBg }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.actionLabel, { color: colors.rejectText }]}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.screenX, paddingTop: 20, gap: 4 },
  back: { fontFamily: font.mono, fontSize: 10, color: colors.grey600, marginBottom: 4 },
  title: { fontFamily: font.bold, fontSize: 20, color: colors.black },
  sub: { fontFamily: font.regular, fontSize: 13, color: colors.grey600 },
  preview: { flex: 1, maxHeight: 400, backgroundColor: colors.black, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewText: { fontFamily: font.monoMedium, fontSize: 11, color: colors.white, letterSpacing: 1 },
  caption: { fontFamily: font.regular, fontSize: 13, color: colors.grey600, marginTop: 12 },
  actionBtn: { height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: font.semibold, fontSize: 15 },
});
