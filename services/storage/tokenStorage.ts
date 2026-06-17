import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Token de Sanctum. AsyncStorage es provisorio — migrar a expo-secure-store en Fase 2.
 * @see https://docs.expo.dev/versions/v54.0.0/sdk/securestore/
 */
const TOKEN_KEY = '@crabb/mobile_token';

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
