import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParams } from './types';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';

const Stack = createNativeStackNavigator<ProfileStackParams>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
