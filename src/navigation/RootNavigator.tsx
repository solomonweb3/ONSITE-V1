import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useStore } from '../store';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { colors } from '../theme';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.white, card: colors.white, primary: colors.black },
};

export function RootNavigator() {
  const { authed } = useStore();
  return <NavigationContainer theme={navTheme}>{authed ? <MainTabs /> : <AuthStack />}</NavigationContainer>;
}
