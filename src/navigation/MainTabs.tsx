import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { TeamStack } from './TeamStack';
import { CalendarScreen } from '../screens/CalendarScreen';
import { useStore } from '../store';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { user } = useStore();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#fff' } }}
    >
      {user.role === 'team' ? (
        <Tab.Screen name="TeamTab" component={TeamStack} options={{ tabBarLabel: 'Team' }} />
      ) : (
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      )}
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ tabBarLabel: 'Calendar' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
