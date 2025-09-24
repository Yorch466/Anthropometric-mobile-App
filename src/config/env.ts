import Constants from 'expo-constants';

export const PROCESS_URL =
  (Constants.expoConfig?.extra?.PROCESS_URL as string) ??
  process.env.EXPO_PUBLIC_PROCESS_URL ??
  '';

export const PROCESS_PATH =
  (Constants.expoConfig?.extra?.PROCESS_PATH as string) ??
  process.env.EXPO_PUBLIC_PROCESS_PATH ??
  '/process';

export const PROCESS_JSON_PATH =
  (Constants.expoConfig?.extra?.PROCESS_JSON_PATH as string) ??
  process.env.EXPO_PUBLIC_PROCESS_JSON_PATH ??
  '/process/json';

export const GOALS_AUTO_PATH =
  (Constants.expoConfig?.extra?.GOALS_AUTO_PATH as string) ??
  process.env.EXPO_PUBLIC_GOALS_AUTO_PATH ??
  '/goals/auto';
