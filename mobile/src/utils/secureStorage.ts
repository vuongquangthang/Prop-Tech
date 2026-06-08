import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStorage = new Map<string, string>();

const getLocalStorage = () => (globalThis as any).localStorage;

const hasLocalStorage = () =>
  typeof getLocalStorage() !== 'undefined';

const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (hasLocalStorage()) {
      return getLocalStorage().getItem(key);
    }
    return memoryStorage.get(key) ?? null;
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (hasLocalStorage()) {
      getLocalStorage().setItem(key, value);
      return;
    }
    memoryStorage.set(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (hasLocalStorage()) {
      getLocalStorage().removeItem(key);
      return;
    }
    memoryStorage.delete(key);
  },
};

export const secureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return webStorage.getItemAsync(key);
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return webStorage.getItemAsync(key);
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return webStorage.setItemAsync(key, value);
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await webStorage.setItemAsync(key, value);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return webStorage.deleteItemAsync(key);
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await webStorage.deleteItemAsync(key);
    }
  },
};
