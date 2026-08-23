import React from 'react';
import { View } from 'react-native';
import { Card, CardTitle, Subtitle, Meta, StatusBadge, ProgressBar } from './ui';
import { Activation } from '../store';

export function ActivationCard({
  activation,
  progress,
  onPress,
}: {
  activation: Activation;
  progress: number;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <CardTitle>{activation.title}</CardTitle>
        <StatusBadge status={activation.status} />
      </View>
      <Subtitle>{activation.subtitle}</Subtitle>
      <ProgressBar value={progress} />
      <Meta>{progress}% complete</Meta>
    </Card>
  );
}
