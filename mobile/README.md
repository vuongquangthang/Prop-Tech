# Apartment Resident Mobile App

React Native mobile application for apartment residents built with Expo.

## Tech Stack

- **React Native**: 0.76.5
- **Expo SDK**: ~52.0.0
- **TypeScript**: ~5.6.2
- **React Navigation**: 7.0 (Bottom Tabs + Native Stack)
- **State Management**: Zustand 5.0
- **HTTP Client**: Axios 1.7.2
- **Real-time**: @microsoft/signalr 8.0
- **Secure Storage**: expo-secure-store

## Features

- ✅ JWT Authentication with auto-refresh token
- ✅ Secure token storage
- ✅ Bottom tab navigation (Home, Incidents, Chat, Profile)
- ✅ Dashboard with notifications and invoices
- ✅ Pull-to-refresh functionality
- ⏳ Incident reporting with image upload
- ⏳ Real-time notifications via SignalR
- ⏳ AI Chatbot
- ⏳ Profile management

## Project Structure

```
mobile/
├── App.tsx                      # Entry point
├── src/
│   ├── navigation/              # Navigation configuration
│   │   ├── RootNavigator.tsx   # Root navigator with auth check
│   │   ├── AuthStack.tsx       # Login screen stack
│   │   └── MainTabs.tsx        # Bottom tabs (Home, Incidents, Chat, Profile)
│   ├── screens/                 # Screen components
│   │   ├── LoginScreen.tsx     # Login screen
│   │   └── HomeScreen.tsx      # Dashboard screen
│   ├── services/                # API and services
│   │   └── api.service.ts      # Axios instance with JWT interceptors
│   ├── store/                   # Zustand state management
│   │   └── authStore.ts        # Authentication state
│   ├── types/                   # TypeScript definitions
│   │   └── dto.ts              # DTOs matching backend models
│   ├── components/              # Reusable components (empty)
│   └── hooks/                   # Custom hooks (empty)
├── package.json
├── tsconfig.json
├── app.json
└── babel.config.js
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo Go app on your mobile device (for testing)
- Backend API running at `http://192.168.128.1:5052`

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - Scan the QR code with Expo Go app (Android)
   - Scan the QR code with Camera app (iOS)

### Alternative: Run on emulator

**Android:**
```bash
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

## Configuration

### Base URL

Update the base URL in [src/services/api.service.ts](src/services/api.service.ts#L7):

```typescript
const BASE_URL = 'http://192.168.128.1:5052'; // Change to your backend URL
```

**Note:** 
- For Android emulator: Use `10.0.2.2:5052` instead of `localhost`
- For iOS simulator: Use `localhost:5052`
- For physical device: Use your computer's local IP address

## Demo Accounts

Test with these credentials:

| Role | Phone | Password |
|------|-------|----------|
| Resident | 0909000003 | password123 |

## API Integration

The app integrates with the .NET 9 backend API:

- **Authentication**: `/api/auth/login`, `/api/auth/refresh-token`
- **Notifications**: `/api/notifications`
- **Invoices**: `/api/invoices`
- **Complaints**: `/api/complaints`
- **SignalR Hub**: `/hubs/notifications` (coming soon)

### JWT Token Flow

1. User logs in → Receives `accessToken` (1h expiry) + `refreshToken` (7d expiry)
2. Tokens stored securely using `expo-secure-store`
3. Every API request includes `Authorization: Bearer {accessToken}`
4. On 401 error → Auto-refresh using refresh token
5. If refresh fails → Logout and redirect to login

## Development

### Type Safety

All DTOs are typed in [src/types/dto.ts](src/types/dto.ts) matching the backend models.

### State Management

Using Zustand for lightweight state management:
- **authStore**: User authentication state

### Error Handling

- Network errors are caught and displayed to users
- 401 errors trigger automatic token refresh
- Failed refreshes logout the user

## Build for Production

### Android APK

```bash
npm run build:android
```

### iOS IPA (Mac only)

```bash
npm run build:ios
```

## Troubleshooting

### Cannot connect to backend

1. Make sure backend is running: `http://192.168.128.1:5052`
2. Check if your phone and computer are on the same network
3. Try using your computer's IP address instead of `192.168.128.1`

### Dependencies issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### Expo cache issues

```bash
npx expo start --clear
```

## Next Steps

- [ ] Implement Incidents screen (list + create)
- [ ] Implement Chat screen with SignalR
- [ ] Implement Profile screen
- [ ] Add image picker for incident attachments
- [ ] Setup push notifications
- [ ] Add offline support
- [ ] Implement invoice payment flow

## License

Private project for apartment management system.
