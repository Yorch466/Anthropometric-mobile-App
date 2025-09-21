import Constants from 'expo-constants';

export const PROCESS_URL =
  (Constants.expoConfig?.extra?.PROCESS_URL as string) ??
  process.env.EXPO_PUBLIC_PROCESS_URL ??
  '';

export const PROCESS_PATH =
  (Constants.expoConfig?.extra?.PROCESS_PATH as string) ??
  process.env.EXPO_PUBLIC_PROCESS_PATH ??
  '/process';
