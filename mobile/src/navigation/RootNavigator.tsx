import React, { useEffect, useCallback } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { AdminTabs } from './AdminTabs';
import BillsScreen from '../screens/BillsScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import IssuesScreen from '../screens/IssuesScreen';
import IssueDetailScreen from '../screens/IssueDetailScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ContractChangeApprovalScreen from '../screens/ContractChangeApprovalScreen';
import RoommatePostScreen from '../screens/RoommatePostScreen';
import RoommateCreateScreen from '../screens/RoommateCreateScreen';
import RoommateDetailScreen from '../screens/RoommateDetailScreen';
import RoommateEditScreen from '../screens/RoommateEditScreen';
import RoommateHistoryScreen from '../screens/RoommateHistoryScreen';
import RoommateMessagesScreen from '../screens/RoommateMessagesScreen';
import RoommateConversationScreen from '../screens/RoommateConversationScreen';
import { useAuthStore } from '../store/authStore';
import signalrService from '../services/signalr.service';
import { isAdminAppUser } from '../utils/roleUtils';
import { palette } from '../theme/palette';

const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    border: palette.border,
    primary: palette.primary,
    text: palette.text,
  },
};

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Bills" component={BillsScreen} />
      <Stack.Screen name="Issues" component={IssuesScreen} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
      <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ContractChangeApproval" component={ContractChangeApprovalScreen} />
      <Stack.Screen name="RoommatePost" component={RoommatePostScreen} />
      <Stack.Screen name="RoommateCreate" component={RoommateCreateScreen} />
      <Stack.Screen name="RoommateDetail" component={RoommateDetailScreen} />
      <Stack.Screen name="RoommateEdit" component={RoommateEditScreen} />
      <Stack.Screen name="RoommateHistory" component={RoommateHistoryScreen} />
      <Stack.Screen name="RoommateMessages" component={RoommateMessagesScreen} />
      <Stack.Screen name="RoommateConversation" component={RoommateConversationScreen} />
    </Stack.Navigator>
  );
};

const AdminStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const loadUserFromStore = useAuthStore((state) => state.loadUser);

  // Memoize loadUser to prevent unnecessary re-renders
  const loadUser = useCallback(() => {
    loadUserFromStore();
  }, [loadUserFromStore]);

  useEffect(() => {
    // Load user from storage on app start
    loadUser();
  }, [loadUser]);

  // SignalR connection management
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, connecting to SignalR...');
      signalrService
        .connect()
        .then(() => {
          console.log('SignalR connected successfully');

          // Subscribe to notifications
          const unsubscribeNotification = signalrService.onNotification((notification) => {
            console.log('Received notification:', notification);
            // You can show a toast/alert or update a notification badge here
          });

          // Subscribe to maintenance updates
          const unsubscribeMaintenanceUpdate = signalrService.onMaintenanceUpdate((request) => {
            console.log('Maintenance request updated:', request);
            // You can trigger a screen refresh here
          });

          // Store unsubscribe functions
          return () => {
            unsubscribeNotification();
            unsubscribeMaintenanceUpdate();
          };
        })
        .catch((error) => {
          console.error('SignalR connection failed, but continuing app:', error);
          // Don't logout user if SignalR fails - app should still work
        });
    } else {
      console.log('User not authenticated, disconnecting from SignalR...');
      signalrService.disconnect();
    }

    return () => {
      if (!isAuthenticated) {
        signalrService.disconnect();
      }
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? (
        user?.mustChangePassword ? (
          <AuthStack initialRouteName="ForceChangePassword" />
        ) : isAdminAppUser(user) ? (
          <AdminStack />
        ) : (
          <MainStack />
        )
      ) : (
        <AuthStack initialRouteName="Login" />
      )}
    </NavigationContainer>
  );
};
