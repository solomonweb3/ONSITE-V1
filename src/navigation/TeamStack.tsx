import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeamStackParams } from './types';
import { TeamHomeScreen } from '../screens/TeamHomeScreen';
import { InviteMemberScreen } from '../screens/InviteMemberScreen';
import { TeamMemberViewScreen } from '../screens/TeamMemberViewScreen';
import { TeamActivationDetailScreen } from '../screens/TeamActivationDetailScreen';
import { TeamSettingsScreen } from '../screens/TeamSettingsScreen';

const Stack = createNativeStackNavigator<TeamStackParams>();

export function TeamStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="TeamHome" component={TeamHomeScreen} />
      <Stack.Screen name="InviteMember" component={InviteMemberScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="TeamMemberView" component={TeamMemberViewScreen} />
      <Stack.Screen name="TeamActivationDetail" component={TeamActivationDetailScreen} />
      <Stack.Screen name="TeamSettings" component={TeamSettingsScreen} />
    </Stack.Navigator>
  );
}
