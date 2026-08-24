import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParams } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { NewActivationScreen } from '../screens/NewActivationScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { AllCompleteScreen } from '../screens/AllCompleteScreen';
import { BrandPreviewScreen } from '../screens/BrandPreviewScreen';
import { BrandReviewItemScreen } from '../screens/BrandReviewItemScreen';
import { RejectReasonScreen } from '../screens/RejectReasonScreen';

const Stack = createNativeStackNavigator<HomeStackParams>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="NewActivation" component={NewActivationScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="AllComplete" component={AllCompleteScreen} />
      <Stack.Screen name="BrandPreview" component={BrandPreviewScreen} />
      <Stack.Screen name="BrandReviewItem" component={BrandReviewItemScreen} />
      <Stack.Screen name="RejectReason" component={RejectReasonScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
