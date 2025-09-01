import Constants from "expo-constants"
export const PROCESS_URL =
  (Constants.expoConfig?.extra?.PROCESS_URL as string) ??
  process.env.EXPO_PUBLIC_PROCESS_URL ??
  "https://62bf17a3adde.ngrok-free.app"

// Log temporal:
console.log("PROCESS_URL =>", PROCESS_URL)
