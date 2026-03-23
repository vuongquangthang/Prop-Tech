import React, { useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import BillsScreen from '../screens/BillsScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import IssueDetailScreen from '../screens/IssueDetailScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useAuthStore } from '../store/authStore';
import signalrService from '../services/signalr.service';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Bills" component={BillsScreen} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} />
      <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        user?.mustChangePassword ? (
          <AuthStack initialRouteName="ForceChangePassword" />
        ) : (
          <MainStack />
        )
      ) : (
        <AuthStack initialRouteName="Login" />
      )}
    </NavigationContainer>
  );
};
