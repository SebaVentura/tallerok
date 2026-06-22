import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@tallerok/access_token';

export async function saveTallerOkToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getTallerOkToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearTallerOkToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
