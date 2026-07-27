import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius } from '../theme/palette';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminUtilityReadingsScreen from '../screens/admin/AdminUtilityReadingsScreen';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';
import AdminMaintenanceScreen from '../screens/admin/AdminMaintenanceScreen';
import AdminInvoicesScreen from '../screens/admin/AdminInvoicesScreen';
import AdminPostsScreen from '../screens/admin/AdminPostsScreen';

export type AdminTabsParamList = {
  AdminHome: undefined;
  AdminReadings: undefined;
  AdminInvoices: undefined;
  AdminMaintenance: undefined;
  AdminPosts: undefined;
  AdminProfile: undefined;
};

const Tab = createBottomTabNavigator<AdminTabsParamList>();

export const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'AdminHome') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'AdminReadings') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'AdminInvoices') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'AdminMaintenance') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'AdminPosts') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          } else if (route.name === 'AdminProfile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return (
            <View
              style={{
                width: 36,
                height: 30,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? palette.primarySoft : 'transparent',
              }}
            >
              <Ionicons name={iconName} size={18} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
          backgroundColor: palette.surface,
          borderTopColor: palette.borderSoft,
          shadowColor: palette.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ tabBarLabel: 'Công việc' }}
      />
      <Tab.Screen
        name="AdminReadings"
        component={AdminUtilityReadingsScreen}
        options={{ tabBarLabel: 'Điện nước' }}
      />
      <Tab.Screen
        name="AdminInvoices"
        component={AdminInvoicesScreen}
        options={{ tabBarLabel: 'Hóa đơn' }}
      />
      <Tab.Screen
        name="AdminMaintenance"
        component={AdminMaintenanceScreen}
        options={{ tabBarLabel: 'Sự cố' }}
      />
      <Tab.Screen
        name="AdminPosts"
        component={AdminPostsScreen}
        options={{ tabBarLabel: 'Bài đăng' }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminAccountScreen}
        options={{ tabBarLabel: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
};
