import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParams } from './types';
import { LandingScreen } from '../screens/auth/LandingScreen';
import { AccountKindScreen } from '../screens/auth/AccountKindScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { TeamAuthScreen } from '../screens/auth/TeamAuthScreen';
import { JoinTeamScreen } from '../screens/auth/JoinTeamScreen';

const Stack = createNativeStackNavigator<AuthStackParams>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="AccountKind" component={AccountKindScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="TeamAuth" component={TeamAuthScreen} />
      <Stack.Screen name="JoinTeam" component={JoinTeamScreen} />
    </Stack.Navigator>
  );
}
