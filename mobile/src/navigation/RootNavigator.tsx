import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Alert } from 'react-native';
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
import ServicePriceChangeDetailScreen from '../screens/ServicePriceChangeDetailScreen';
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
      <Stack.Screen name="ServicePriceChangeDetail" component={ServicePriceChangeDetailScreen} />
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
  const { isAuthenticated, user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const loadUserFromStore = useAuthStore((state) => state.loadUser);
  const [isInitializing, setIsInitializing] = useState(true);
  const sessionRevokedAlertShownRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    loadUserFromStore().finally(() => {
      if (isMounted) {
        setIsInitializing(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadUserFromStore]);

  // SignalR connection management
  useEffect(() => {
    let unsubscribeNotification: (() => void) | undefined;
    let unsubscribeMaintenanceUpdate: (() => void) | undefined;
    let unsubscribeSessionRevoked: (() => void) | undefined;

    if (isAuthenticated) {
      console.log('User authenticated, connecting to SignalR...');
      signalrService
        .connect()
        .then(() => {
          console.log('SignalR connected successfully');

          // Subscribe to notifications
          unsubscribeNotification = signalrService.onNotification((notification) => {
            console.log('Received notification:', notification);
            // You can show a toast/alert or update a notification badge here
          });

          // Subscribe to maintenance updates
          unsubscribeMaintenanceUpdate = signalrService.onMaintenanceUpdate((request) => {
            console.log('Maintenance request updated:', request);
            // You can trigger a screen refresh here
          });

          unsubscribeSessionRevoked = signalrService.onSessionRevoked(async (payload) => {
            if (sessionRevokedAlertShownRef.current) return;
            sessionRevokedAlertShownRef.current = true;
            const message = payload?.message || 'Tài khoản của bạn vừa đăng nhập ở một thiết bị khác';
            await logout();
            Alert.alert('Phiên đăng nhập đã kết thúc', message, [
              {
                text: 'OK',
                onPress: () => {
                  sessionRevokedAlertShownRef.current = false;
                },
              },
            ]);
          });
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
      unsubscribeNotification?.();
      unsubscribeMaintenanceUpdate?.();
      unsubscribeSessionRevoked?.();
      if (!isAuthenticated) {
        signalrService.disconnect();
      }
    };
  }, [isAuthenticated, logout]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  const mustChangePassword = Boolean(user?.mustChangePassword ?? (user as any)?.MustChangePassword);
  const navigationKey = !isAuthenticated
    ? 'guest'
    : mustChangePassword
      ? 'force-change-password'
      : isAdminAppUser(user)
        ? 'admin'
        : 'resident';

  return (
    <NavigationContainer key={navigationKey} theme={navigationTheme}>
      {isAuthenticated ? (
        mustChangePassword ? (
          <AuthStack key="force-change-password" initialRouteName="ForceChangePassword" />
        ) : isAdminAppUser(user) ? (
          <AdminStack />
        ) : (
          <MainStack />
        )
      ) : (
        <AuthStack key="login" initialRouteName="Login" />
      )}
    </NavigationContainer>
  );
};
