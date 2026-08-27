import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

// Plays a video from a URI (Storage URL, local file, or pasted link).
export function VideoPreview({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  return <VideoView player={player} style={style} nativeControls contentFit="cover" />;
}

// Helper to detect a video by filename/URL.
export const isVideoLabel = (s?: string | null) => !!s && /\.(mp4|mov|webm|m4v)(\?|$)/i.test(s);
