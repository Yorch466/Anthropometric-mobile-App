import Constants from "expo-constants"
export const PROCESS_URL =
  (Constants.expoConfig?.extra?.PROCESS_URL as string) ??
  process.env.EXPO_PUBLIC_PROCESS_URL ??
  "http://192.168.1.11:8000"

// Log temporal:
console.log("PROCESS_URL =>", PROCESS_URL)
