import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE_KEY = '@tallerok/demo_mode_chosen';

export async function saveDemoModeChosen(chosen: boolean): Promise<void> {
  if (chosen) {
    await AsyncStorage.setItem(DEMO_MODE_KEY, '1');
    return;
  }
  await AsyncStorage.removeItem(DEMO_MODE_KEY);
}

export async function getDemoModeChosen(): Promise<boolean> {
  const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
  return value === '1';
}

export async function clearDemoModeChosen(): Promise<void> {
  await AsyncStorage.removeItem(DEMO_MODE_KEY);
}
