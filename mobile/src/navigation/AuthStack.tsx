import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ForceChangePasswordScreen from '../screens/ForceChangePasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ForceChangePassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthStackProps = {
  initialRouteName?: keyof AuthStackParamList;
};

export const AuthStack = ({ initialRouteName = 'Login' }: AuthStackProps) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
      />
      <Stack.Screen 
        name="ForceChangePassword" 
        component={ForceChangePasswordScreen}
        options={{
          gestureEnabled: false, // Disable swipe back gesture
        }}
      />
    </Stack.Navigator>
  );
};
