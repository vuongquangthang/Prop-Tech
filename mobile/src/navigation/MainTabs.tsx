import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import RoommateMessagesScreen from '../screens/RoommateMessagesScreen';
import BillsScreen from '../screens/BillsScreen';
import IssuesScreen from '../screens/IssuesScreen';
import AccountScreen from '../screens/AccountScreen';
import { palette } from '../theme/palette';

export type MainTabsParamList = {
  Home: undefined;
  Messages: undefined;
  Bills: undefined;
  Issues: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Bills') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Issues') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return (
            <View
              style={{
                width: focused ? 44 : 36,
                height: 34,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.primarySoft : 'transparent',
              }}
            >
              <Ionicons name={iconName} size={focused ? 22 : size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 86,
          paddingBottom: 28,
          paddingTop: 9,
          backgroundColor: palette.surface,
          borderTopColor: 'rgba(226, 232, 240, 0.85)',
          borderTopWidth: 1,
          shadowColor: palette.shadowStrong,
          shadowOpacity: 1,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -6 },
          elevation: 18,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="Bills"
        component={BillsScreen}
        options={{ tabBarLabel: 'Hóa đơn' }}
      />
      <Tab.Screen
        name="Messages"
        component={RoommateMessagesScreen}
        options={{ tabBarLabel: 'Tin nhắn' }}
      />
      <Tab.Screen
        name="Issues"
        component={IssuesScreen}
        options={{ tabBarLabel: 'Sự cố' }}
      />
      <Tab.Screen
        name="Profile"
        component={AccountScreen}
        options={{ tabBarLabel: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
};
